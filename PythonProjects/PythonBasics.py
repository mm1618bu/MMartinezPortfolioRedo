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