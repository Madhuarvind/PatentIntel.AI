import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

# Ensure destination directory exists
os.makedirs('docx/assets', exist_ok=True)

# Set global figure style
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']

fig, ax = plt.subplots(figsize=(8.5, 6.5), dpi=300)
fig.patch.set_facecolor('white')
ax.set_facecolor('white')

# Data
configurations = [
    'Full Model',
    'w/o Multimodal\nFusion',
    'w/o Statutory\nFeature Extraction',
    'w/o Claim\nDecomposition Module',
    'w/o SBERT\nSemantic Embeddings'
]

f1_scores = [89.8, 87.2, 85.1, 80.5, 69.0]
callout_texts = [
    '(89.8%)',
    '87.2%\n(-2.6%)',
    '85.1%\n(-4.7%)',
    '80.5%\n(-9.3%)',
    '69.0%\n(-20.8%)'
]

y_pos = np.arange(len(configurations))
bar_color = '#3276a6'  # Ocean blue matching original image

# Draw horizontal bars
bars = ax.barh(y_pos, f1_scores, height=0.55, color=bar_color, edgecolor='none', zorder=3)
ax.invert_yaxis()  # Top to bottom

# Set Title (Single clean title)
ax.set_title('Ablation Study: Impact of Module Removal\non PatentIntel.AI Performance',
             fontsize=17, fontweight='bold', pad=25, color='#000000', ha='center')

# Axis labels
ax.set_xlabel('F1 Score (%)', fontsize=13, fontweight='bold', labelpad=12, color='#000000')
ax.set_ylabel('Configuration', fontsize=13, fontweight='bold', labelpad=15, color='#000000')

# X-ticks & formatting
ax.set_xlim(0, 108)
ax.set_xticks([0, 20, 40, 60, 80, 100])
ax.set_xticklabels(['0%', '20%', '40%', '60%', '80%', '100%'], fontsize=11, color='#000000')

# Y-ticks
ax.set_yticks(y_pos)
ax.set_yticklabels(configurations, fontsize=11, color='#000000', fontweight='normal')

# Remove top, right, left spines, keep bottom and left line
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_color('#000000')
ax.spines['left'].set_linewidth(1.2)
ax.spines['bottom'].set_color('#000000')
ax.spines['bottom'].set_linewidth(1.2)

# Vertical grid lines
ax.grid(axis='x', linestyle='-', color='#E5E7EB', alpha=0.8, zorder=0)

# Add Callout Bubbles with Pointers
for i, (bar, text_val) in enumerate(zip(bars, callout_texts)):
    x_val = bar.get_width()
    y_val = bar.get_y() + bar.get_height() / 2.0

    # Draw callout box
    bbox_props = dict(boxstyle="round,pad=0.4,rounding_size=0.3",
                      facecolor="white", edgecolor="#000000", lw=1.0)
    
    # Arrow properties
    arrow_props = dict(arrowstyle="-", color="#000000", lw=1.0)

    ax.annotate(text_val, xy=(x_val, y_val), xytext=(x_val + 7, y_val),
                fontsize=10.5, color='#000000', ha='center', va='center',
                bbox=bbox_props, arrowprops=arrow_props, zorder=6)

plt.tight_layout()

output_path = os.path.join('docx', 'assets', 'fig6_ablation_performance_chart.png')
plt.savefig(output_path, dpi=300, bbox_inches='tight')
plt.close()

print(f"Successfully generated clean ablation chart without bottom text at {output_path}")
