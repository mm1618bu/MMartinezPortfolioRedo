import React from "react";
import './ui/food.css';
// Font Awesome CSS is now loaded via <link> in public/index.html

const defaultCategories = [
    {
        id: "c_001",
        name: "Pizza",
        icon: "fa-solid fa-pizza-slice",
    },
    {
        id: "c_002",
        name: "Burgers",
        icon: "fa-solid fa-burger",
    },
    {
        id: "c_003",
        name: "Sushi",
        icon: "fa-solid fa-fish",
    },
    {
        id: "c_004",
        name: "Desserts",
        icon: "fa-solid fa-ice-cream",
    },
    {
        id: "c_005",
        name: "Salads",
        icon: "fa-solid fa-leaf",
    },
    {
        id: "c_006",
        name: "Drinks",
        icon: "fa-solid fa-cocktail",
    },
    {
        id: "c_007",
        name: "Mexican",
        icon: "fa-solid fa-taco",
    },
    {
        id: "c_008",
        name: "Indian",
        icon: "fa-solid fa-bowl-rice",
    },
    {
        id: "c_009",
        name: "Chinese",
        icon: "fa-solid fa-dragon",
    },
    {
        id: "c_010",
        name: "Italian",
        icon: "fa-solid fa-spaghetti-monster-flying",   
    },
    {
        id: "c_011",
        name: "Breakfast",
        icon: "fa-solid fa-bacon",
    },
    {
        id: "c_012",
        name: "Vegan",
        icon: "fa-solid fa-seedling",
    },

];

export default function CategoryCarousel({ storeCategories = defaultCategories }) {
    return (
        <div>
            {storeCategories.map(category => (
                <div className="category-card" key={category.id}>
                    <i className={category.icon}></i><br/>
                    <span>{category.name}</span>
                </div>
            ))}
        </div>
    );
}
