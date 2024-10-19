def organize_bags(aisles, num_bags_per_aisle, route_size):
    routes = []
    current_route = []
    remaining_bags = len(aisles) * num_bags_per_aisle

    for aisle in aisles:
        for bag_num in range(1, num_bags_per_aisle + 1):
            if len(current_route) < route_size:
                current_route.append((aisle, bag_num))
            else:
                routes.append(current_route)
                current_route = [(aisle, bag_num)]
            remaining_bags -= 1

    # Add the remaining bags to the last route
    if current_route:
        routes.append(current_route)

    return routes

# Define the aisles and the number of bags per aisle
aisles = [f"{aisle}{num}" for aisle in "ABCDEFGHJ" for num in range(1, 27)]
num_bags_per_aisle = 24
route_size = 27

# Organize the bags into routes
routes = organize_bags(aisles, num_bags_per_aisle, route_size)

# Write the routes to a new file
with open("routes.txt", "w") as file:
    for i, route in enumerate(routes):
        file.write(f"Route {i+1}:\n")
        for aisle, bag_num in route:
            file.write(f"  - {aisle} Bag {bag_num}\n")