import numpy as np

array = np.array([1, 2, 3, 4, 5])
array = array * 2 # Multiply each element by 2
print("Array:", array)

# multidimensional array
array_2d = np.array([[1, 2, 3], [4, 5, 6]]) # rows and columns
print("2D Array:\n", array_2d.shape) # layers, rows, columns
array_3d = array_2d.reshape((3, 2))
array_4d = array_2d.reshape((2, 3, 1, 1))
print(array_2d[0,0,0]) # multidemensional indexing

# slicing
arrayp = np.array([[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]])
print(arrayp[1:3, 1:3]) # slicing rows and columns
print(arrayp[:, 1:3]) # all rows, columns 1 and 2
print(arrayp[1:3, :]) # rows 1 and 2, all columns
print(arrayp[0:4:2]) # every other row
print(arrayp[:,0])
print(arrayp[:-1])

# arithmetic operations
# scalar operations
array10 = np.array([1, 2, 3])
print(array10 + 5) # add 5 to each element
print(array10 - 2) # subtract 2 from each element
print(array10 * 3) # multiply each element by 3
print(array10 / 2) # divide each element by 2
print(array10 ** 2) # square each element
print(array10 % 2) # modulus of each element by 2

# vectorized operations
array11 = np.array([1.01, 2.5, 3.99])
print(np.sqrt(array11)) # square root of each element
print(np.round(array11)) # round each element
print(np.floor(array11)) # floor of each element
print(np.ceil(array11)) # ceiling of each element
print(np.pi)

# element-wise operations
array12 = np.array([1, 2, 3])
array13 = np.array([4, 5, 6])
print(array12 + array13) # element-wise addition
print(array12 - array13) # element-wise subtraction
print(array12 * array13) # element-wise multiplication
print(array12 / array13) # element-wise division
print(array12 ** array13) # element-wise exponentiation

# comparison operations
array14 = np.array([91,55,100,73,82,64])
print(array14 == 100) # element-wise equality
print(array14 != 100) # element-wise inequality
print(array14 > 70) # element-wise greater than
print(array14 < 70) # element-wise less than
print(array14 >= 82) # element-wise greater than or equal to
print(array14 <= 82) # element-wise less than or equal to


# broadcasting
array15 = np.array([[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]])
array16 = np.array([[10,11],[20,21],[30,31],[40,41]])
print(array15 + array16) # broadcasting addition
print(array15 * array16) # broadcasting multiplication
print(array15 - array16) # broadcasting subtraction
print(array16 - array15) # broadcasting subtraction

# multiplication table example
rows = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
cols = np.array([[1], [2], [3], [4], [5], [6], [7], [8], [9], [10]])
print(rows * cols) # broadcasting multiplication for multiplication table

# aggregate functions
array17 = np.array([[1,2,3,4,5],[6,7,8,9,10]])
print(np.sum(array17)) # sum of all elements
print(np.mean(array17)) # mean of all elements
print(np.median(array17)) # median of all elements
print(np.std(array17)) # standard deviation of all elements
print(np.var(array17)) # variance of all elements
print(np.min(array17)) # minimum element
print(np.max(array17)) # maximum element
print(np.argmin(array17)) # index of minimum element
print(np.argmax(array17)) # index of maximum element
print(np.unique(array17)) # unique elements
print(np.sort(array17, axis=None)) # sorted elements
print(np.sort(array17, axis=0)) # sort along columns
print(np.sort(array17, axis=1)) # sort along rows
print(np.transpose(array17)) # transpose of the array
print(np.flatten(array17)) # flatten the array
print(np.reshape(array17, (5,2))) # reshape the array
print(np.concatenate((array17, array17), axis=0)) # concatenate along rows
print(np.concatenate((array17, array17), axis=1)) # concatenate along columns
print(np.split(array17, 2, axis=0)) # split along rows
print(np.split(array17, 5, axis=1)) # split along columns
print(np.sum(array17, axis=0)) # sum along columns
print(np.sum(array17, axis=1)) # sum along rows

# filtering
ages = np.array([[21,17,19,20,16,30,18,65],[39,18,23,29,26,50,33,72]])
college = ages[ages <= 22]
print("College ages:", college)
adults = ages[(ages >= 18) & (ages < 65)]
print("Adult ages:", adults)
seniors = ages[ages >= 65]
print("Senior ages:", seniors)
evens = ages[ages % 2 == 0]
print("Even ages:", evens)
odds = ages[ages % 2 != 0]
print("Odd ages:", odds)
adults2 = np.where(ages >= 18, ages, np.nan)
print("Adults with NaN:\n", adults2)

# random numbers
rng = np.random.default_rng() # create a random number generator
random_floats = rng.random(5) # 5 random floats between 0 and 1
print("Random floats:", random_floats)
random_integers = rng.integers(10, 50, size=5)
print("Random integers between 10 and 50:", random_integers)
random_normal = rng.normal(loc=0.0, scale=1.0, size=5)
print("Random normal distribution:", random_normal)
random_choice = rng.choice(['apple', 'banana', 'cherry', 'date'], size=3)
print("Random choice of fruits:", random_choice)
shuffled_array = np.array([1, 2, 3, 4, 5])
rng.shuffle(shuffled_array)
print("Shuffled array:", shuffled_array)
print(np.random.uniform(0, 1, 5)) # 5 random floats between 0 and 1 using legacy interface