"""
PERITIA — Architecture Diagram Generator
Generates docs/architecture.png using matplotlib only (no graphviz dependency).
"""
import sys
import os

try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
except ImportError:
    print("matplotlib not available — please install it: pip install matplotlib")
    sys.exit(1)


def draw_box(ax, x, y, w, h, label, sublabel="", color="#26262b", text_color="#e8e6e1",
             border_color="#8b6f47", fontsize=9, sublabel_fontsize=7.5):
    box = FancyBboxPatch(
        (x - w/2, y - h/2), w, h,
        boxstyle="round,pad=0.02",
        linewidth=1.2,
        edgecolor=border_color,
        facecolor=color,
        zorder=3,
    )
    ax.add_patch(box)
    if sublabel:
        ax.text(x, y + 0.12, label, ha='center', va='center',
                fontsize=fontsize, fontweight='bold', color=text_color, zorder=4)
        ax.text(x, y - 0.13, sublabel, ha='center', va='center',
                fontsize=sublabel_fontsize, color="#9e9b96", zorder=4)
    else:
        ax.text(x, y, label, ha='center', va='center',
                fontsize=fontsize, fontweight='bold', color=text_color, zorder=4)


def draw_arrow(ax, x1, y1, x2, y2, color="#4a7fa5"):
    ax.annotate("",
        xy=(x2, y2), xytext=(x1, y1),
        arrowprops=dict(
            arrowstyle="-|>",
            color=color,
            lw=1.2,
            connectionstyle="arc3,rad=0.0",
        ),
        zorder=2,
    )


def generate_architecture():
    fig, ax = plt.subplots(figsize=(14, 10))
    fig.patch.set_facecolor('#111113')
    ax.set_facecolor('#111113')
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 10)
    ax.axis('off')

    # Title
    ax.text(7, 9.6, 'PERITIA — System Architecture',
            ha='center', va='center', fontsize=14, fontweight='bold',
            color='#e8e6e1', zorder=5)
    ax.text(7, 9.25, 'AI-Powered RAG-Based Intelligent Interview Trainer',
            ha='center', va='center', fontsize=9, color='#9e9b96', zorder=5)

    # ── User ──────────────────────────────────────────────────────────────
    draw_box(ax, 7, 8.6, 2.2, 0.55, 'User',
             sublabel='Interview Candidate',
             color='#1e2e1e', border_color='#4a7a5a', fontsize=10)

    draw_arrow(ax, 7, 8.32, 7, 7.78)

    # ── Frontend ──────────────────────────────────────────────────────────
    draw_box(ax, 7, 7.5, 3.2, 0.5, 'PERITIA Frontend',
             sublabel='React 18 + TypeScript + Vite  |  Port 3000',
             color='#1e2633', border_color='#4a7fa5')

    draw_arrow(ax, 7, 7.25, 7, 6.72)

    # ── Backend ───────────────────────────────────────────────────────────
    draw_box(ax, 7, 6.45, 3.2, 0.5, 'FastAPI Backend',
             sublabel='Python 3.11  |  Uvicorn  |  Port 8000',
             color='#261e33', border_color='#7a4fa5')

    # Three branches from backend
    draw_arrow(ax, 5.4, 6.45, 2.8, 6.45)   # Left: Profile/Resume
    draw_arrow(ax, 7, 6.20, 7, 5.67)         # Center: RAG
    draw_arrow(ax, 8.6, 6.45, 11.2, 6.45)   # Right: watsonx

    # ── Profile & Resume ──────────────────────────────────────────────────
    draw_box(ax, 1.8, 6.45, 2.4, 0.5, 'Profile Analyzer',
             sublabel='Resume Extraction · Skills Gap',
             color='#261e1e', border_color='#a54f4f')

    # ── RAG ───────────────────────────────────────────────────────────────
    draw_box(ax, 7, 5.4, 3.2, 0.5, 'RAG Knowledge Retriever',
             sublabel='FAISS IndexFlatIP · Sentence Transformers',
             color='#1e2626', border_color='#4a8080')

    draw_arrow(ax, 7, 5.15, 7, 4.62)

    # ── Knowledge Base ────────────────────────────────────────────────────
    draw_box(ax, 7, 4.35, 3.2, 0.5, 'Knowledge Base',
             sublabel='Software Eng · Data Analyst · ML Eng · Web Dev · Behavioral/HR',
             color='#1a1a20', border_color='#606080')

    # ── watsonx ───────────────────────────────────────────────────────────
    draw_box(ax, 12.2, 6.45, 2.4, 0.5, 'IBM watsonx.ai',
             sublabel='Llama-3.3-70B  ·  IAM Auth',
             color='#1e261e', border_color='#6a9a4a')

    # ── Interview Intelligence ────────────────────────────────────────────
    # Arrows from Profile + RAG + watsonx into Interview Intelligence
    draw_arrow(ax, 1.8, 6.20, 3.6, 3.55)
    draw_arrow(ax, 7, 4.10, 7, 3.55)
    draw_arrow(ax, 12.2, 6.20, 10.4, 3.55)

    draw_box(ax, 7, 3.3, 6.8, 0.5, 'Interview Intelligence Workflow',
             sublabel='Interview Planner · Question Generator · Answer Evaluator',
             color='#26221a', border_color='#8b6f47', fontsize=9.5)

    draw_arrow(ax, 4.6, 3.05, 3.4, 2.5)   # -> Questions
    draw_arrow(ax, 7,   3.05, 7,   2.5)   # -> Evaluation
    draw_arrow(ax, 9.4, 3.05, 10.6, 2.5)  # -> Progress

    # ── Output Layer ──────────────────────────────────────────────────────
    draw_box(ax, 3.0, 2.22, 2.6, 0.5, 'Questions & Answers',
             sublabel='Technical · Behavioral · HR · Role-Specific',
             color='#1e2633', border_color='#4a7fa5', fontsize=8)

    draw_box(ax, 7, 2.22, 2.6, 0.5, 'Evaluation & Feedback',
             sublabel='Score · Strengths · Gaps · Advice',
             color='#1e2626', border_color='#4a8080', fontsize=8)

    draw_box(ax, 11, 2.22, 2.6, 0.5, 'Progress Dashboard',
             sublabel='Session · Scores · Charts',
             color='#261e1e', border_color='#a54f4f', fontsize=8)

    # Merge back to user
    draw_arrow(ax, 3.0, 1.97, 5.5, 1.1)
    draw_arrow(ax, 7,   1.97, 7,   1.1)
    draw_arrow(ax, 11,  1.97, 8.5, 1.1)

    draw_box(ax, 7, 0.82, 3.2, 0.45, 'User Experience',
             sublabel='Personalized Preparation & Practice',
             color='#1e2e1e', border_color='#4a7a5a', fontsize=9)

    # ── Legend ────────────────────────────────────────────────────────────
    legend_x, legend_y = 0.3, 1.8
    legend_items = [
        ('#4a7fa5', 'Frontend / API'),
        ('#8b6f47', 'Core Workflow'),
        ('#4a8080', 'RAG / Knowledge'),
        ('#6a9a4a', 'IBM watsonx.ai'),
        ('#4a7a5a', 'User / Output'),
    ]
    for i, (color, label) in enumerate(legend_items):
        patch = mpatches.Patch(facecolor=color, edgecolor=color, label=label)
        ax.text(legend_x, legend_y - i * 0.28, '█', color=color, fontsize=10, va='center')
        ax.text(legend_x + 0.25, legend_y - i * 0.28, label,
                color='#9e9b96', fontsize=7.5, va='center')

    plt.tight_layout(pad=0.5)
    os.makedirs('docs', exist_ok=True)
    plt.savefig('docs/architecture.png', dpi=150, bbox_inches='tight',
                facecolor='#111113', edgecolor='none')
    plt.close()
    print("Architecture diagram saved to docs/architecture.png")


if __name__ == '__main__':
    generate_architecture()
