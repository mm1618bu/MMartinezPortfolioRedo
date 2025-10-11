def calculatePaycheck(hours,wage):
    grossPay = hours * wage
    taxes = grossPay * .20;
    netPay = grossPay - taxes;
    print(grossPay, taxes, netPay)

def groceryList():
    emptyCart = [];
    emptyCart.append('Apple');
    emptyCart.append('Banana');
    emptyCart.append('Orange');
    emptyCart.pop(0);
    print(emptyCart)

def checkPhoneNumber(phoneNumber):
   if (len(phoneNumber) < 10):
       print('That is not long enough. Please try again.');
       return
   else:
       print("Good! That is a valid phone number!");

def iphoneModels():
    iphoneSKU = set([1,2,1,2,3,4,2,2,3]);
    model = iphoneSKU.intersection([1,2,3]);
    print(iphoneSKU);
    print(model);

def dictExample():
    person = {'name':'John Doe','age':40,'city':'New York'};
    print(person['name']);

# Mad Libs Game
adjective1 = input("Enter an adjective: ");
noun1 = input("Enter a noun: ");

print(f"Today I went to a {adjective1} zoo.");
print(f"I saw a {noun1} jumping up and down in its tree.");

# math without libraries
friends = 0
friends += 1
friends -= 2
friends *= 4
friends /= 2
friends **= 2
remainder = friends % 2
print(friends,remainder);

x = 3.14
y = -4
z = 5

result = round(x);
result2 = abs(y);
result3 = pow(z,3);
print(result,result2,result3);
total = max(x,y,z);
print(total);
calculatePaycheck(16,15)
groceryList()
checkPhoneNumber('1234445566')
iphoneModels()
dictExample()

# with math library
import math

circumference = 2 * math.pi * 5;

print(math.pi);
print(math.e);
print(math.sqrt(16));
print(math.ceil(3.14));
print(math.floor(3.14));
print(math.sqrt(25));
print(circumference);

# calculator
operator = input("Enter an operator (+,-,*,/): ");
num1 = float(input("Enter first number: "));
num2 = float(input("Enter second number: "));
if operator == "+":
    print(num1 + num2);
elif operator == "-":
    print(num1 - num2);
elif operator == "*":
    print(num1 * num2);
elif operator == "/":
    print(round(num1 / num2));
else:
    print("Invalid operator");

# python weight converter
weight = float(input("Enter your weight: "));
unit = input("(L)bs or (K)g: ");
if unit.upper() == "K":
    weight = weight * 2.205;
elif unit.upper() == "L":
    weight = weight / 2.205;
else:
    print("Invalid unit");
    exit();
print(f"Your weight is {weight} in {'Lbs' if unit.upper() == 'K' else 'Kgs'}");

# tempreture converter
unit = input("Convert to (F)arenheit or (C)elsius: ");
temp = float(input("Enter the temperature: "));

if unit == "C":
    converted = (temp - 32) * 5/9;
    print(f"{temp}F is {round(converted,2)}C");
elif unit == "F":
    converted = (temp * 9/5) + 32;
    print(f"{temp}C is {round(converted,2)}F");
else:
    print("Invalid unit");


# logical operators
temp1 = 25
is_raining = False
if temp1 < 0 or temp1 > 30 or is_raining:
    print("The weather is good today!");

# String Methods
name = " Kelly"
result = len(name);
result2 = name.find('y');
result3 = name.rfind('l');
result4 = name.capitalize();
print(result,result2,result3,result4);
result5 = name.upper();
result6 = name.lower();
name.isdigit(); # returns true only if all characters are digits
name.isalpha(); # returns true only if all characters are letters
name.isalnum(); # returns true only if all characters are letters and numbers
name.replace('K','P');
print(result5,result6,name);

username = input("Enter your username: ");
if len(username) >= 12:  
    print("Invalid username");
elif not username.find(' ') == -1:
    print("Invalid username");
else:
    print(f"Valid username");

price1 = 3.140931
price2 = 114.99
price3 = 21.59
price4 = 1000.5
price5 = 1022.920202

print(f"Price 1: ${price1:.2f}");
print(f"Price 2: ${price2:.2f}");
print(f"Price 3: ${price3:<10}");

def print_symbol_grid():
    rows = int(input("Enter number of rows: "))
    columns = int(input("Enter number of columns: "))
    symbol = input("Enter a symbol to use: ")
    for x in range(rows):
        for y in range(columns):
            print(symbol, end=' ')
        print()



# Lists, Tuples, Sets
fruits = ['Apple','Banana','Orange','Grapes']; # list
print(fruits.index('Banana'));
fruits.append('Mango');
fruits.insert(1,'Strawberry');
fruits.remove('Orange');
fruits.pop();
fruits.sort();
fruits.reverse();
print(fruits);

fruitset = {"apple","peach","bananna","lemon"}; # set
print(len(fruitset));
fruitset.add("pineapple");
fruitset.remove("apple");
fruitset.pop();

fruittuple = ("apple", "peach", "bananna","lemon") # tuple

# 2D List
fruits2D = ['Apple','Banana','Orange'];
vegetables2D = ['Carrot','Potato','Onion'];
meats2D = ['Chicken','Beef','Pork'];

grocery2D = [fruits2D,vegetables2D,meats2D];
grocery2DA = [['Apple','Banana','Orange'],['Carrot','Potato','Onion'],['Chicken','Beef','Pork']];
for collection in grocery2DA:
    for item in collection:
        print(item);

# Dictionaries
capitals = {'USA':'Washington DC','India':'New Delhi','China':'Beijing','Russia':'Moscow'};
print(capitals['India']);
print(capitals.get('China'));
print(capitals.keys());
print(capitals.values());
print(capitals.items());

# Random Numbers
import random;

low = 1
high = 100
diceroll = random.randint(low,high);
options = ("rock","paper","scissors");
num = random.random(); # returns a random float between 0 and 1
randomoption = random.choice(options);
print(diceroll,num,randomoption);
random.shuffle();

# functions
def net_price(list_price, discount=0, tax=0.05):
    discount_amount = list_price * discount
    price_after_discount = list_price - discount_amount
    tax_amount = price_after_discount * tax
    final_price = price_after_discount + tax_amount
    return round(final_price, 2)

def hello(greeting, title, first, last):
    print(f"{greeting} {title} {first} {last}")
    return
hello("Hello","Mr.","John","Doe");

# *args and **kwargs
def add(*nums):
    total = 0
    for arg in args:
        total += arg
    return total

# Match-Case Statements

def is_weekend(day):
    match day:
        case "Saturday" | "Sunday":
            return True
        case "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday":
            return False
        case _:
            return "Invalid day"

# Object Oriented Programming
class Car:

    wheels = 4;
    num_students = 0;
    def __init__(self, make, model, year, color):
        self.make = make
        self.model = model
        self.year = year
        self.color = color
        Car.num_students += 1;

    def start(self):
        print(f"The {self.color} {self.make} {self.model} is starting.")
    def stop(self):
        print(f"The {self.color} {self.make} {self.model} is stopping.")
my_car = Car("Toyota", "Camry", 2020, "blue")
my_car.start()
my_car.stop()
print(f"My car is a {my_car.year} {my_car.color} {my_car.make} {my_car.model}.")

# Inheritance

class Animal():
    def __init__(self, name):
        self.name = name
        self.is_alive = True

    def eat(self):
        print(f"{self.name} is eating.")

    def sleep(self):
        print(f"{self.name} is sleeping.")

class Dog(Animal):
    def speek(self):
        print(f"{self.name} says Woof!")

class Cat(Animal):
    def speek(self):
        print(f"{self.name} says Meow!")

class Mouse(Animal):
    def speek(self):
        print(f"{self.name} says Squeak!")

dog = Dog("Buddy")
cat = Cat("Whiskers")
mouse = Mouse("Mickey") 

dog.eat()
cat.sleep()
mouse.eat()
dog.speek()
cat.speek()
mouse.speek()

# Multiple Inheritance / Multilevel Inheritance

class Prey:
    def flee(self):
        print(f"{self.name} is fleeing.")

class Predator:
    def hunt(self):
        print(f"{self.name} is hunting.")

class Rabbit(Prey):
    pass

class Hawk(Predator):
    pass

class Fish(Prey,Predator):
    pass

rabbit = Rabbit("Bugs")
hawk = Hawk("Tony")
fish = Fish("Nemo")

fish.hunt()
fish.flee()
rabbit.flee()
hawk.hunt()

# Super

class Shape:
    def __inint__(self, color, fill):
        self.color = color
        self.fill = fill

class Circle(Shape):
    def __init__(self, color, fill, radius):
        super().__init__(color, fill)
        self.radius = radius

class Square(Shape):
    def __init__(self, color, fill, width):
        super().__init__(color, fill)
        self.width = width

class Triangle(Shape):
    def __init__(self, color, fill, height):
        super().__init__(color, fill)
        self.height = height

circle = Circle("red",True,5)
square = Square("blue",False,4)
triangle = Triangle("green",True,3)
print(circle.color,circle.fill,circle.radius)

# Polymorphism

class Shaper:
    
    def area(self):
        pass

class Circular(Shaper):
    pass

class Square(Shaper):
    pass

class Triangle(Shaper):
    pass

circle = Circular()
square = Square()
Shaper = [Circular(4),Square(5),Triangle(6,7)]

# Static methods

class Employee:

    def __init__(self, name, position):
        self.name = name
        self.position = position

    def get_info(self):
        return f"{self.name} is a {self.position}"

    @staticmethod
    def is_valid_position(position):
        valid_positions = ["Manager", "Developer", "Designer", "Intern"]
        return position in valid_positions

Employee1 = Employee("John Doe", "Developer")
Employee2 = Employee("Jane Smith", "Manager")
Employee3 = Employee("Alice Johnson", "CEO")
Employee4 = Employee("Bob Brown", "Intern")
print(Employee1.get_info()) # John Doe is a Developer
print(Employee2.get_info()) # Jane Smith is a Manager
print(Employee3.get_info()) # Alice Johnson is a CEO
print(Employee4.get_info()) # Bob Brown is a Intern

print(Employee.is_valid_position("Manager")) # True
print(Employee.is_valid_position("CEO")) # False

# class methods
class Student:

    count =0

    def ___init__(self, name, gpa):
        self.name = name
        self.gpa = gpa
        Student.count += 1

    #THIS IS A INSTANCE METHOD
    def get_info(self):
        return f"{self.name} has a GPA of {self.gpa}"

    @classmethod
    def get_count(cls):
        return f"There are {cls.count} students"

student1 = Student("John Doe", 3.5)
student2 = Student("Jane Smith", 3.8)
print(student1.get_info()) # John Doe has a GPA of 3.5
print(student2.get_info()) # Jane Smith has a GPA of 3.8

print(Student.get_count()) # There are 0 students

# Magic Method
class Book:
    
    def __init__(self, title, author, pages):
        self.title = title
        self.author = author
        self.pages = pages

    def __str__(self):
        return f"{self.title} by {self.author}"

    def __len__(self):
        return self.pages

    def __del__(self):
        print(f"{self.title} has been deleted")

    def __gt__(self, other):
        return self.pages > other.pages
    
book1 = Book("Python Basics", "John Doe", 200)
book2 = Book("Advanced Python", "Jane Smith", 300)
print(book1) # Python Basics by John Doe
print(len(book2)) # 300

# property decorator

class Rectangle:
    def __init__(self, width, height):
        self._width = width
        self._height = height

    @property
    def width(self):
        return f"{self._width:.1f}"

    @property
    def height(self):
        return f"{self._height:.1f}"

    @width.setter
    def width(self, new_width):
        if new_width >= 0:
            self._width = new_width
        else:
            raise ValueError("Width must be non-negative")

    @width.deleter
    def width(self):
        del self._width
        print("Width deleted")

Rectangle = Rectangle(10, 5)
print(Rectangle.width) # 10
print(Rectangle.height) # 5

def add_sprinkles(func):
    def wrapper():
        print("Adding sprinkles")
        func()
    return wrapper

def add_fudge(func):
    def wrapper():
        print("Adding fudge")
        func()
    return wrapper

@add_sprinkles
def get_ice_cream():
    print("Here's your ice cream")

try:
    number = int(input("Enter a number: "))
    print(1/number)
except ValueError:
    print("Invalid input. Please enter a valid number.")
finally:
    print("Execution completed.")

# file detection
import os
file_path = 'test.txt'
if os.path.exists(file_path):
    print("File exists")
    with open(file_path, 'r') as file:
        content = file.read()
        print(content)
else:
    print("File does not exist")
    with open(file_path, 'w') as file:
        file.write("This is a test file.")
        print("File created")

# dates and times
import datetime
date = datetime.date(2023, 1, 1)
print(date)
today = datetime.date.today()
print(today)
time = datetime.time(12, 30, 45)
print(time)
now = datetime.datetime.now()
now = now.strftime("%Y-%m-%d %H:%M:%S")
print(now)
target_date = datetime.date(2024, 12, 25)
current_date = datetime.date.today()
if target_date > current_date:
    delta = target_date - current_date
    print(f"There are {delta.days} days until {target_date}")
else:
    print(f"{target_date} has already passed")

# multithreading
import threading
import time

def walk_dog():
    time.sleep(8)
    print("Walking the dog {first} {last}")

def take_out_trash():
    time.sleep(2)
    print("Taking out the trash")

def get_mail():
    time.sleep(4)
    print("Getting the mail")

chore1 = threading.Thread(target=walk_dog,args=("Leon","Parker"))
chore1.start()
chore2 = threading.Thread(target=take_out_trash)
chore2.start()
chore3 = threading.Thread(target=get_mail)
chore3.start()

chore1.join()
chore2.join()
chore3.join()