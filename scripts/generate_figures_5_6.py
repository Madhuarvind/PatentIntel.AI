import os
import matplotlib.pyplot as plt
import numpy as np

# Ensure docx/assets directory exists
os.makedirs('docx/assets', exist_ok=True)

# Set global academic plot styles
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 11

# ==========================================
# FIGURE 5: PRECISION-RECALL CURVE GRAPH
# ==========================================
fig, ax = plt.subplots(figsize=(8, 5.5), dpi=300)

recall = np.array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
p_bm25 = np.array([82.4, 79.1, 75.3, 72.8, 70.1, 67.5, 64.2, 60.8, 55.4, 48.0])
p_sbert = np.array([91.5, 89.2, 86.8, 84.5, 82.1, 79.4, 76.2, 72.5, 66.8, 58.2])
p_painet = np.array([94.2, 92.8, 90.4, 88.9, 87.1, 85.0, 82.4, 79.1, 74.5, 67.0])
p_proposed = np.array([98.1, 96.8, 95.2, 93.9, 92.5, 91.2, 89.5, 87.2, 83.6, 76.4])

ax.plot(recall, p_proposed, 'o-', color='#1E40AF', linewidth=2.5, markersize=6, label='PatentIntel.AI (Proposed)', zorder=5)
ax.plot(recall, p_painet, 's--', color='#6366F1', linewidth=2.0, markersize=5, label='PAI-NET RAG [12]', zorder=4)
ax.plot(recall, p_sbert, '^-.', color='#F59E0B', linewidth=2.0, markersize=5, label='Standard SBERT [18]', zorder=3)
ax.plot(recall, p_bm25, 'x:', color='#EF4444', linewidth=1.8, markersize=6, label='Lexical BM25 Baseline', zorder=2)

# Highlight callout for P@10 at Recall = 0.6
ax.annotate('P@10 = 91.2%', xy=(0.6, 91.2), xytext=(0.65, 94.5),
            fontweight='bold', color='#1E40AF', fontsize=10.5,
            arrowprops=dict(arrowstyle='->', color='#1E40AF', lw=1.5),
            bbox=dict(boxstyle='round,pad=0.3', facecolor='#EFF6FF', edgecolor='#1E40AF', lw=1))

ax.set_xlabel('Recall', fontsize=12, fontweight='bold', labelpad=10)
ax.set_ylabel('Precision (%)', fontsize=12, fontweight='bold', labelpad=10)
ax.set_title('Fig. 5: Precision-Recall Curves (PatentMatch 6.26M Dataset)', fontsize=13, fontweight='bold', pad=15)
ax.set_xlim(0.05, 1.05)
ax.set_ylim(40, 102)
ax.grid(True, linestyle='--', alpha=0.5)
ax.legend(loc='lower left', frameon=True, facecolor='#F9FAFB', edgecolor='#D1D5DB')

plt.tight_layout()
fig5_path = os.path.join('docx', 'assets', 'fig5_precision_recall_curve.png')
plt.savefig(fig5_path, dpi=300)
plt.close()
print(f"Saved Figure 5 to {fig5_path}")


# ==========================================
# FIGURE 6: COMPONENT ABLATION BAR CHART
# ==========================================
fig, ax = plt.subplots(figsize=(8.5, 5), dpi=300)

components = [
    'Full PatentIntel.AI Model',
    'w/o Multimodal Drawing Verification',
    'w/o Statutory Legal Screening',
    'w/o Structural Claim Decomposition',
    'w/o SBERT Dense Multi-Vector'
]

f1_scores = [89.8, 87.2, 85.1, 80.5, 69.0]
f1_shifts = ['Baseline', '-2.6%', '-4.7%', '-9.3%', '-20.8%']
bar_colors = ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE']

y_pos = np.arange(len(components))

bars = ax.barh(y_pos, f1_scores, color=bar_colors, edgecolor='black', height=0.55, linewidth=1.1, zorder=3)
ax.invert_yaxis()  # Labels top-to-bottom

# Annotate scores and shifts on bars
for i, bar in enumerate(bars):
    width = bar.get_width()
    shift_str = f" ({f1_shifts[i]})" if i > 0 else " (Baseline)"
    ax.text(width + 1.0, bar.get_y() + bar.get_height()/2.0,
            f"{width:.1f}%{shift_str}",
            va='center', ha='left', fontsize=10, fontweight='bold', color='#1E293B')

ax.set_xlabel('F1 Score (%) [Higher is Better]', fontsize=12, fontweight='bold', labelpad=10)
ax.set_title('Fig. 6: System Component Ablation Performance Shift', fontsize=13, fontweight='bold', pad=15)
ax.set_xlim(50, 100)
ax.set_yticks(y_pos)
ax.set_yticklabels(components, fontsize=10.5, fontweight='bold')
ax.grid(True, linestyle='--', alpha=0.4, axis='x', zorder=0)

plt.tight_layout()
fig6_path = os.path.join('docx', 'assets', 'fig6_ablation_performance_chart.png')
plt.savefig(fig6_path, dpi=300)
plt.close()
print(f"Saved Figure 6 to {fig6_path}")
