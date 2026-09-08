import os
import matplotlib.pyplot as plt
import numpy as np

# Ensure docx/assets directory exists
os.makedirs('docx/assets', exist_ok=True)

# Set global academic plot styles
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 11

# ==========================================
# FIGURE 7: LATENCY VS PRECISION PARETO PLOT
# ==========================================
fig, ax = plt.subplots(figsize=(8, 5.5), dpi=300)

models = [
    'Lexical BM25',
    'Standard SBERT',
    'BM25 + SBERT Hybrid',
    'PAI-NET RAG [12]',
    'CPC-Aware LLM [16]',
    'PatentIntel.AI (Proposed)'
]

latency = [120, 185, 210, 340, 290, 145]
precision = [69.6, 81.2, 84.8, 86.1, 87.2, 91.2]
colors = ['#EF4444', '#F59E0B', '#10B981', '#6366F1', '#8B5CF6', '#1E40AF']
markers = ['o', 's', '^', 'D', 'p', '*']
sizes = [120, 120, 120, 140, 140, 260]

for i in range(len(models)):
    if 'PatentIntel.AI' in models[i]:
        ax.scatter(latency[i], precision[i], color=colors[i], marker=markers[i], s=sizes[i], zorder=5, label=models[i], edgecolor='black', linewidth=1.5)
        ax.annotate(f"{models[i]}\n(145ms, 91.2%)", (latency[i], precision[i]), xytext=(latency[i]-35, precision[i]+1.5),
                    fontweight='bold', color='#1E40AF', fontsize=10,
                    arrowprops=dict(arrowstyle='->', color='#1E40AF', lw=1.2))
    else:
        ax.scatter(latency[i], precision[i], color=colors[i], marker=markers[i], s=sizes[i], zorder=4, label=models[i], alpha=0.85)
        ax.annotate(f"{models[i]}\n({latency[i]}ms, {precision[i]}%)", (latency[i], precision[i]), xytext=(latency[i]+8, precision[i]-1.2),
                    fontsize=8.5, color='#374151')

# Draw Pareto Frontier Line
pareto_x = [120, 145]
pareto_y = [69.6, 91.2]
ax.plot(pareto_x, pareto_y, ':', color='#1E40AF', linewidth=1.8, label='Optimal Pareto Frontier')

ax.set_xlabel('Execution Latency (ms) [Lower is Better]', fontsize=12, fontweight='bold', labelpad=10)
ax.set_ylabel('Precision @ 10 (%) [Higher is Better]', fontsize=12, fontweight='bold', labelpad=10)
ax.set_title('Fig. 7: Execution Latency vs. Precision@10 Tradeoff (PatentMatch 6.26M)', fontsize=13, fontweight='bold', pad=15)
ax.set_xlim(90, 370)
ax.set_ylim(65, 95)
ax.grid(True, linestyle='--', alpha=0.5)
ax.legend(loc='lower right', frameon=True, facecolor='#F9FAFB', edgecolor='#D1D5DB')

plt.tight_layout()
fig7_path = os.path.join('docx', 'assets', 'fig7_latency_precision_scatter.png')
plt.savefig(fig7_path, dpi=300)
plt.close()
print(f"Saved Figure 7 to {fig7_path}")


# ==========================================
# FIGURE 8: EXAMINATION VELOCITY BAR CHART
# ==========================================
fig, ax = plt.subplots(figsize=(7.5, 5), dpi=300)

workflows = ['Traditional Manual\nPatent Examination', 'PatentIntel.AI Automated\nPatent Examination']
times_minutes = [252, 18]  # 252 mins = 4.2 hrs, 18 mins = 0.3 hrs
bar_colors = ['#DC2626', '#059669']

bars = ax.bar(workflows, times_minutes, color=bar_colors, width=0.45, edgecolor='black', linewidth=1.2, zorder=3)

# Add data labels on top of bars
for bar in bars:
    height = bar.get_height()
    hours = height / 60.0
    ax.annotate(f'{height} Mins\n({hours:.1f} Hours)',
                xy=(bar.get_x() + bar.get_width() / 2, height),
                xytext=(0, 6),  # 6 points vertical offset
                textcoords="offset points",
                ha='center', va='bottom', fontsize=11, fontweight='bold')

# Draw highlight callout for velocity gain
ax.annotate('92.8% Operational\nTime Reduction!',
            xy=(1, 18), xytext=(0.55, 140),
            fontsize=12, fontweight='bold', color='#059669',
            bbox=dict(boxstyle='round,pad=0.5', facecolor='#ECFDF5', edgecolor='#059669', lw=2),
            arrowprops=dict(arrowstyle='->', connectionstyle='arc3,rad=-0.2', color='#059669', lw=2))

ax.set_ylabel('Mean Examination Time per Application (Minutes)', fontsize=12, fontweight='bold', labelpad=10)
ax.set_title('Fig. 8: Operational Examination Velocity Comparison', fontsize=13, fontweight='bold', pad=15)
ax.set_ylim(0, 300)
ax.grid(True, linestyle='--', alpha=0.4, axis='y', zorder=0)

plt.tight_layout()
fig8_path = os.path.join('docx', 'assets', 'fig8_examination_velocity_bar.png')
plt.savefig(fig8_path, dpi=300)
plt.close()
print(f"Saved Figure 8 to {fig8_path}")
