import pandas as pd

# Series creation
data = [100,102,104]
series1 = pd.Series(data, index=['a', 'b', 'c'] )
print(series1.loc['a'])  # Accessing element by label
print(series1.iloc[0])   # Accessing element by position
calories = {'day1': 420, 'day2': 380, 'day3': 390}
series2 = pd.Series(calories)
print(series2)
print(series2.loc['day2'])
series2.loc['day3'] += 450  # Modifying element
print(series2)

# DataFrame creation
data = {
    'calories': [420, 380, 390],
    'duration': [50, 40, 45]
}
df1 = pd.DataFrame(data)
print(df1)
print(df1.loc[0])  # Accessing row by label
print(df1.iloc[0]) # Accessing row by position
df1.at[0, 'calories'] = 500  # Modifying element
print(df1)
new_row = pd.DataFrame({'calories': [450], 'duration': [60]})
df1 = pd.concat([df1, new_row], ignore_index=True)  # Adding
print(df1)
df1 = df1.drop(1)  # Deleting
print(df1)

# importing csv and json
df2 = pd.read_csv('data.csv', index_col="Name")
df3 = pd.read_json('data.json')
print(df2.to_string())  # Print entire DataFrame
print(df2.head())  # First 5 rows
print(df2.tail(3))  # Last 3 rows
print(df2.info())  # DataFrame info
print(df2.describe())  # Statistical summary

# selection
print(df2['column_name'])  # Single column
print(df2[['col1', 'col2']])  # Multiple columns
print(df2.loc[0])  # Single row by label
print(df2.iloc[0])  # Single row by position
print(df2.loc[0:2, ['col1', 'col2']])  # Rows 0-2, specific columns
print(df2[df2['col1'] > 50])  # Conditional selection

# filtering
df2_filtered = df2[(df2['col1'] > 50) & (df2['col2'] < 100)]
print(df2_filtered)
df2_filtered_or = df2[(df2['col1'] > 50) | (df2['col2'] < 100)]
print(df2_filtered_or)
legency_pokemon = df3[df3['generation'] == True]
print(legency_pokemon)
water_pokemon = df3[df3['type'] == 'Water']
print(water_pokemon)
earth_pokemon = df3[(df3['type'] == 'Ground') | (df3['type'] == 'Rock')]
print(earth_pokemon)
fire_pokemon = df3[(df3['type'] == 'Fire') & (df3['generation'] == False)]
print(fire_pokemon)

# Aggregate functions - whole data frame
print(df2.mean(numeric_only=True))  # Mean of a column
print(df2.sum(numeric_only=True))   # Sum of a column
print(df2.min(numeric_only=True))   # Minimum of a column
print(df2.max(numeric_only=True))   # Maximum of a column
print(df2.count())                  # Count of non-null values

# Aggregate functions - specific column
print(df2['col1'].mean(numeric_only=True))  # Mean of col1
print(df2['col1'].sum(numeric_only=True))   # Sum of col1
print(df2['col1'].min(numeric_only=True))   # Minimum of col1
print(df2['col1'].max(numeric_only=True))   # Maximum of col1
print(df2['col1'].count())                  # Count of non-null values in col1

# Grouping
grouped = df2.groupby('category_col')
print(grouped['col1'].mean(numeric_only=True))  # Mean of col1
print(grouped['col1'].sum(numeric_only=True))   # Sum of col1
print(grouped['col1'].min(numeric_only=True))   # Minimum of col1
print(grouped['col1'].max(numeric_only=True))   # Maximum of col1
print(grouped['col1'].count())                  # Count of non-null values in col1

# data cleaning
df2.drop(columns=['unnecessary_col','No'], inplace=True)  # Drop column
df2.dropna(inplace=True)  # Drop rows with null values
df2.fillna({"Type2":"None"})  # Fill null values with 0
df2.rename(columns={'old_name': 'new_name'}, inplace=True)  # Rename column
df2['col1'] = df2['col1'].astype(float)  # Change data type
print(df2.to_string())
print(df2.isnull().sum())  # Check for null values
df2["col1"] = df2["col1"].replace({"Grass":"GRASS","Fire":"FIRE","water":"WATER"})  # Replace 0 with mean
