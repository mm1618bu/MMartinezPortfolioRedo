import matplotlib.pyplot as plt
import numpy as np

x = np.array([2023,2024,2025,2026])
y = np.array([15,25,30,20])
z = np.array([17,23,38,5])
plt.plot(x,y)
plt.show()

line_styles = dict(marker='o', markersize=30 , markerfacecolor="cyan", linestyle='--', color='r', label='Sales Data')

# plot customization
plt.plot(x, y, marker='o', markersize=30 , markerfacecolor="cyan", linestyle='--', color='r', label='Sales Data')
plt.grid(True)
plt.legend()
plt.show()

plt.plot(x, y, color="#1c5bfc", **line_styles)

# labels and title
plt.title('Yearly Sales Data', fontsize=16, fontweight='bold', color='#333333')
plt.xlabel('Year', fontsize=14, color='#666666')
plt.ylabel('Sales (in thousands)', fontsize=14, color='#666666')
plt.xticks(x, fontsize=12, rotation=45)
plt.yticks(np.arange(0, 41, 5), fontsize=12)
plt.grid(visible=True, linestyle='--', linewidth=0.5, color='#aaaaaa')
plt.legend(fontsize=12)
plt.tight_layout()
plt.show()

# grid lines
plt.plot(x, y, **line_styles)
plt.grid(visible=True, linestyle='--', linewidth=0.5, color='#aaaaaa')
plt.show()

# bar chart
categories = ["Grains", "Fruits", "Vegetables", "Dairy", "Proteins","Sweets"]
values = [25, 30, 15, 10, 18, 12]

plt.bar(categories, values)
plt.title('Food Category Consumption', fontsize=16, fontweight='bold', color='#333333')
plt.xlabel('Food Categories', fontsize=14, color='#666666')
plt.ylabel('Consumption (in units)', fontsize=14, color='#666666')
plt.xticks(fontsize=12, rotation=45)
plt.yticks(np.arange(0, 36, 5), fontsize=12)
plt.grid(visible=True, linestyle='--', linewidth=0.5, color='#aaaaaa', axis='y')

# Pie chart
pie_categories = ["Category A", "Category B", "Category C", "Category D"]
pie_values = [40, 25, 20, 15]
colors = ['#ff9999','#66b3ff','#99ff99','#ffcc99']
plt.pie(pie_values, labels=pie_categories, colors=colors, autopct='%1.1f%%', startangle=140)
plt.title('Distribution of Categories', fontsize=16, fontweight='bold', color='#333333')
plt.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle
plt.show()

# Scatter graph
x_scatter = [0,1,2,3,4,5,6,7,8,9]
y_scatter = [55,47,49,52,48,46,50,53,44,45]
plt.scatter(x_scatter, y_scatter, color='#ff5733', marker='o', s=100, label='Data Points')
plt.title('Scatter Plot Example', fontsize=16, fontweight='bold', color='#333333')
plt.xlabel('X-axis', fontsize=14, color='#666666')
plt.ylabel('Y-axis', fontsize=14, color='#666666')
plt.xticks(fontsize=12)
plt.yticks(fontsize=12)
plt.grid(visible=True, linestyle='--', linewidth=0.5, color='#aaaaaa')
plt.legend(fontsize=12)
plt.show()

# Histogram
scores = np.random.normal(loc=75, scale=10, size=100)
scores = np.clip(scores, 0, 100)  # Ensure scores are between 0 and 100
plt.hist(scores)
plt.title('Histogram of Scores', fontsize=16, fontweight='bold', color='#333333')
plt.xlabel('Score Ranges', fontsize=14, color='#666666')
plt.ylabel('Number of Students', fontsize=14, color='#666666')
plt.xticks(np.arange(0, 101, 10), fontsize=12)
plt.yticks(fontsize=12)
plt.grid(visible=True, linestyle='--', linewidth=0.5, color='#aaaaaa', axis='y')
plt.show()
plt.hist(scores, bins=10, color='#82caff', edgecolor='black')
plt.title('Histogram of Scores', fontsize=16, fontweight='bold', color='#333333')
plt.xlabel('Score Ranges', fontsize=14, color='#666666')
plt.ylabel('Number of Students', fontsize=14, color='#666666')
plt.xticks(np.arange(0, 101, 10), fontsize=12)
plt.yticks(fontsize=12)
plt.grid(visible=True, linestyle='--', linewidth=0.5, color='#aaaaaa', axis='y')
plt.show()

# subplots
figure, axes = plt.subplots(2,2)
axes[0,0].plot(x, y, color='#1c5bfc', **line_styles)
axes[0,0].set_title('Line Plot', fontsize=14, fontweight='bold', color='#333333')
axes[0,0].grid(visible=True, linestyle='--', linewidth=0.5, color='#aaaaaa')
axes[0,1].bar(categories, values, color='#ffb347', edgecolor='black')
axes[0,1].set_title('Bar Chart', fontsize=14, fontweight='bold', color='#333333')
axes[0,1].grid(visible=True, linestyle='--', linewidth=0.5, color='#aaaaaa', axis='y')
axes[1,0].scatter(x_scatter, y_scatter, color='#33ff57', marker='o', s=100)
axes[1,0].set_title('Scatter Plot', fontsize=14, fontweight='bold', color='#333333')
axes[1,0].grid(visible=True, linestyle='--', linewidth=0.5, color='#aaaaaa')
axes[1,1].hist(scores, bins=10, color='#ff6699', edgecolor='black')
axes[1,1].set_title('Histogram', fontsize=14, fontweight='bold', color='#333333')
axes[1,1].grid(visible=True, linestyle='--', linewidth=0.5, color='#aaaaaa', axis='y')
plt.tight_layout()
plt.show()  

# pandas and matplotlib
