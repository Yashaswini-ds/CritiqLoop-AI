import os
import sys
import logging
from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.markdown import Markdown

from src.graph.workflow import build_workflow
from src.state import AgentState

# Load environment configuration
load_dotenv()

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

console = Console()

# Configure lightweight application logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stderr)] if os.getenv("CRITIQLOOP_DEBUG") else []
)
logger = logging.getLogger("CritiqLoop")


def print_iteration_summary(history_entry, quality_threshold: int):
    """Prints a styled summary of an iteration review cycle including explicit Quality Gate checks."""
    review = history_entry.review
    iteration_num = history_entry.iteration

    table = Table(title=f"Iteration {iteration_num} Review Scores", show_header=True, header_style="bold magenta")
    table.add_column("Metric", style="cyan")
    table.add_column("Score", style="bold yellow", justify="right")

    table.add_row("Relevance", f"{review.relevance}/10")
    table.add_row("Clarity", f"{review.clarity}/10")
    table.add_row("Completeness", f"{review.completeness}/10")
    table.add_row("Overall Quality", f"{review.overall_quality}/10")

    console.print(Panel(table, border_style="blue", title=f"[bold blue]Iteration {iteration_num} Summary[/bold blue]"))

    if review.strengths:
        console.print("[bold green]Strengths:[/bold green]")
        for s in review.strengths:
            console.print(f"  ✓ {s}")

    if review.weaknesses:
        console.print("[bold red]Weaknesses:[/bold red]")
        for w in review.weaknesses:
            console.print(f"  ✗ {w}")

    console.print(f"\n[bold yellow]Actionable Feedback:[/bold yellow] {review.feedback}\n")

    # Quality Gate Transparency Panel
    score_pass = review.overall_quality >= quality_threshold
    approved_pass = review.approved is True
    is_approved = score_pass and approved_pass

    gate_result_str = "[bold green]PASS (APPROVED)[/bold green]" if is_approved else "[bold red]FAIL (REFINEMENT REQUIRED)[/bold red]"

    gate_table = Table(show_header=False, box=None)
    gate_table.add_row("Quality Threshold Required:", f"{quality_threshold}/10")
    gate_table.add_row("Overall Quality Score:", f"{review.overall_quality}/10 {'[green]✓[/green]' if score_pass else '[red]✗[/red]'}")
    gate_table.add_row("Reviewer Approved Flag:", f"{review.approved} {'[green]✓[/green]' if approved_pass else '[red]✗[/red]'}")
    gate_table.add_row("[bold]Quality Gate Result:[/bold]", gate_result_str)

    console.print(Panel(gate_table, title="[bold cyan]Quality Gate Decision[/bold cyan]", border_style="cyan"))
    console.print()


def validate_environment():
    """Validates that required Groq configuration is available in environment."""
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key or groq_api_key.strip() == "" or groq_api_key == "your_groq_api_key_here":
        console.print(
            Panel(
                "[bold red]Configuration Error: Missing GROQ_API_KEY[/bold red]\n\n"
                "Please configure your Groq API key in the [bold].env[/bold] file:\n\n"
                "1. Open or create [bold].env[/bold] in the project root\n"
                "2. Add your Groq key: [bold green]GROQ_API_KEY=gsk_your_key_here[/bold green]\n"
                "3. You can obtain an API key at: [link=https://console.groq.com/keys]https://console.groq.com/keys[/link]",
                title="[bold yellow]Environment Setup Required[/bold yellow]",
                border_style="red"
            )
        )
        sys.exit(1)


def run_critiq_loop(prompt: str, max_iterations: int = 3, quality_threshold: int = 8):
    """Executes the CritiqLoop AI workflow for a given user prompt with full observability."""
    validate_environment()
    logger.info("Starting CritiqLoop workflow execution")

    console.print(Panel.fit("[bold green]CritiqLoop AI Agentic Feedback Loop[/bold green]", subtitle="LangGraph + Groq Orchestration"))
    console.print(f"[bold]User Goal Prompt:[/bold] {prompt}\n")
    console.print(f"[dim]Configuration -> Max Iterations: {max_iterations} | Quality Threshold: {quality_threshold}/10 | Model: {os.getenv('GROQ_MODEL', 'openai/gpt-oss-120b')}[/dim]\n")

    initial_state: AgentState = {
        "task_prompt": prompt,
        "current_draft": "",
        "latest_review": None,
        "history": [],
        "iteration_count": 1,
        "max_iterations": max_iterations,
        "quality_threshold": quality_threshold,
        "status": "IN_PROGRESS"
    }

    app = build_workflow()

    try:
        console.print("[dim cyan][Workflow] Executing agentic feedback graph...[/dim cyan]\n")
        final_state = app.invoke(initial_state)

        history = final_state.get("history", [])
        status = final_state.get("status")
        final_draft = final_state.get("current_draft")
        error_msg = final_state.get("error_message")
        latest_review = final_state.get("latest_review")

        console.print("[bold underline cyan]Execution Iteration Audit Trail[/bold underline cyan]\n")
        for entry in history:
            print_iteration_summary(entry, quality_threshold)

        iterations_used = len(history) if history else final_state.get("iteration_count", 1)
        final_quality = f"{latest_review.overall_quality}/10" if latest_review else "N/A"

        # Final Summary Panel
        if status == "APPROVED":
            logger.info(f"Workflow APPROVED in {iterations_used} iterations")
            summary_table = Table(show_header=False, box=None)
            summary_table.add_row("[bold]Final Status:[/bold]", "[bold green]APPROVED[/bold green]")
            summary_table.add_row("[bold]Iterations Used:[/bold]", f"{iterations_used} / {max_iterations}")
            summary_table.add_row("[bold]Final Quality Score:[/bold]", f"[bold green]{final_quality}[/bold green]")

            console.print(Panel(summary_table, title="[bold green]Final Summary[/bold green]", border_style="green"))
            console.print(Panel(Markdown(final_draft), title="[bold green]FINAL APPROVED DRAFT[/bold green]", border_style="green"))
            console.print("[bold green]SUCCESS: Draft passed all quality gates![/bold green]")

        elif status == "MAX_ITERATIONS_REACHED":
            logger.warning(f"Workflow reached max iterations ({max_iterations})")
            summary_table = Table(show_header=False, box=None)
            summary_table.add_row("[bold]Final Status:[/bold]", "[bold yellow]MAX_ITERATIONS_REACHED[/bold yellow]")
            summary_table.add_row("[bold]Iterations Used:[/bold]", f"{iterations_used} / {max_iterations}")
            summary_table.add_row("[bold]Final Quality Score:[/bold]", f"[bold yellow]{final_quality}[/bold yellow]")

            console.print(Panel(summary_table, title="[bold yellow]Final Summary[/bold yellow]", border_style="yellow"))
            console.print(Panel(Markdown(final_draft), title="[bold yellow]FINAL DRAFT (MAX ITERATIONS REACHED)[/bold yellow]", border_style="yellow"))
            console.print("[bold yellow]TERMINATED: Maximum iteration limit reached before full quality approval.[/bold yellow]")

        elif status == "FAILED":
            logger.error(f"Workflow FAILED: {error_msg}")
            reason = error_msg or "An unexpected execution error occurred."
            console.print(
                Panel(
                    f"[bold red]CritiqLoop AI Execution Failed[/bold red]\n\n"
                    f"[bold yellow]Reason:[/bold yellow] {reason}",
                    title="[bold red]Execution Failure[/bold red]",
                    border_style="red"
                )
            )
            sys.exit(1)
        else:
            console.print(f"[bold red]Workflow completed with status: {status}[/bold red]")

        return final_state

    except Exception as e:
        logger.error(f"Unhandled exception during workflow execution: {e}")
        console.print(f"[bold red]Error running CritiqLoop AI:[/bold red] {e}")
        sys.exit(1)


def main():
    if len(sys.argv) > 1:
        user_prompt = " ".join(sys.argv[1:])
    else:
        user_prompt = "Write a professional overview explaining Agentic AI loops and LangGraph state machines for software engineers."

    max_iter = int(os.getenv("MAX_ITERATIONS", 3))
    quality_thresh = int(os.getenv("QUALITY_THRESHOLD", 8))

    run_critiq_loop(user_prompt, max_iterations=max_iter, quality_threshold=quality_thresh)


if __name__ == "__main__":
    main()
