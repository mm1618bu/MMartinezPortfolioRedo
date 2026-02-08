import React, { useState } from 'react';
import LoginForm from './LoginForm';
import WarehouseTable from './WarehouseTable';

const DraggableAssignmentTable = () => {
  const [assignments, setAssignments] = useState({
    StowAisleA: {
      '1 - 4': [],
      '5 - 8': [],
      '9 - 12': [],
      '13 - 16': [],
      '17 - 20': [],
      '21 - 24': [],
      '25 - 26': [],
    },
    StowAisleB: {
      '1 - 4': [],
      '5 - 8': [],
      '9 - 12': [],
      '13 - 16': [],
      '17 - 20': [],
      '21 - 24': [],
      '25 - 26': [],
    },
    StowAisleC: {
      '1 - 4': [],
      '5 - 8': [],
      '9 - 12': [],
      '13 - 16': [],
      '17 - 20': [],
      '21 - 24': [],
      '25 - 26': [],
    },
    StowAisleD: {
      '1 - 4': [],
      '5 - 8': [],
      '9 - 12': [],
      '13 - 16': [],
      '17 - 20': [],
      '21 - 24': [],
      '25 - 26': [],
    },
    StowAisleE: {
      '1 - 4': [],
      '5 - 8': [],
      '9 - 12': [],
      '13 - 16': [],
      '17 - 20': [],
      '21 - 24': [],
      '25 - 26': [],
    },
    StowAisleG: {
      '1 - 4': [],
      '5 - 8': [],
      '9 - 12': [],
      '13 - 16': [],
      '17 - 20': [],
      '21 - 24': [],
      '25 - 26': [],
    },
    StowAisleH: {
      '1 - 4': [],
      '5 - 8': [],
      '9 - 12': [],
      '13 - 16': [],
      '17 - 20': [],
      '21 - 24': [],
      '25 - 26': [],
    },
    StowAisleJ: {
      '1 - 4': [],
      '5 - 8': [],
      '9 - 12': [],
      '13 - 16': [],
      '17 - 20': [],
      '21 - 24': [],
      '25 - 26': [],
    },
    PickAisleA: {
      '1 - 4': [],
      '5 - 8': [],
      '9 - 12': [],
      '13 - 16': [],
      '17 - 20': [],
      '21 - 24': [],
      '25 - 26': [],
    },
    PickAisleB: {
      '1 - 4': [],
      '5 - 8': [],
      '9 - 12': [],
      '13 - 16': [],
      '17 - 20': [],
      '21 - 24': [],
      '25 - 26': [],
    },
    PickAisleE: {
      '1 - 4': [],
      '5 - 8': [],
      '9 - 12': [],
      '13 - 16': [],
      '17 - 20': [],
      '21 - 24': [],
      '25 - 26': [],
    },
    PickAisleG: {
      '1 - 4': [],
      '5 - 8': [],
      '9 - 12': [],
      '13 - 16': [],
      '17 - 20': [],
      '21 - 24': [],
      '25 - 26': [],
    },
    Divert1: {
      'Person 1' : [],
      'Person 2' : [],
      'Person 3' : [],
    },
    Divert2: {
      'Person 1' : [],
      'Person 2' : [],
      'Person 3' : [],
    },
    TruckUnload:{
      'Person 1' : [],
      'Person 2' : [],
      'Person 3' : [],
    },
    Waterspider:{
      'Person 1' : [],
      'Person 2' : [],
      'Person 3' : [],
    },
    LineLoader:{
      'Person 1' : [],
      'Person 2' : [],
      'Person 3' : [],
    },
    LineScanner:{
      'Person 1' : [],
      'Person 2' : [],
      'Person 3' : [],
    },
    LinePusher:{
      'Person 1' : [],
      'Person 2' : [],
      'Person 3' : [],
    },
    ASLLineLoad:{ 
      'Person 1' : [],
      'Person 2' : [],
      'Person 3' : [],
    },
    ASLLineScan:{
      'Person 1' : [],
      'Person 2' : [],
      'Person 3' : [],
    },
    ASLLinePush:{
      'Person 1' : [],
      'Person 2' : [],
      'Person 3' : [],
    },
    ProblemSolver:{
      'Person 1' : [],
      'Person 2' : [],
      'Person 3' : [],
    },
  });

  // Sample assignments
  const [pendingAssignments, setPendingAssignments] = useState([
    { id: 1, name: 'Alice Johnson', additionalInfo: 'Developer', days: 'MTWR' },
    { id: 2, name: 'Bob Smith', additionalInfo: 'Designer', days: 'TWRF' },
    { id: 3, name: 'Charlie Brown', additionalInfo: 'Product Manager', days: 'WRFS' },
    { id: 4, name: 'Dana Scully', additionalInfo: 'Researcher', days: 'RFSU' },
    { id: 5, name: 'Ethan Hunt', additionalInfo: 'Mission Specialist', days: 'FSUM' },
    { id: 6, name: 'Fiona Gallagher', additionalInfo: 'Analyst', days: 'SUMT' },
    { id: 7, name: 'Gordon Ramsay', additionalInfo: 'Chef', days: 'UMTW' },
    { id: 8, name: 'Hannah Baker', additionalInfo: 'Writer', days: 'MTWR' },
    { id: 9, name: 'Ian Malcolm', additionalInfo: 'Mathematician', days: 'TWRF' },
    { id: 10, name: 'Julius Caesar', additionalInfo: 'Emperor', days: 'WRFS' },
    { id: 11, name: 'Kira Yukimura', additionalInfo: 'Werewolf Hunter', days: 'RFSU' },
    { id: 12, name: 'Leonard Nimoy', additionalInfo: 'Actor', days: 'FSUM' },
    { id: 13, name: 'Monica Geller', additionalInfo: 'Paleontologist', days: 'SUMT' },
    { id: 14, name: 'Nina Simone', additionalInfo: 'Musician', days: 'UMTW' },
    { id: 15, name: 'Oscar Isaac', additionalInfo: 'Actor', days: 'MTWR' },
    { id: 16, name: 'Penny Lane', additionalInfo: 'Publicist', days: 'TWRF' },
    { id: 17, name: 'Quentin Tarantino', additionalInfo: 'Director', days: 'WRFS' },
    { id: 18, name: 'Rachel Green', additionalInfo: 'Fashionista', days: 'RFSU' },
    { id: 19, name: 'Sam Winchester', additionalInfo: 'Hunter', days: 'FSUM' },
    { id: 20, name: 'Tina Fey', additionalInfo: 'Comedian', days: 'SUMT' },
    { id: 21, name: 'Uma Thurman', additionalInfo: 'Actress', days: 'UMTW' },
    { id: 22, name: 'Victor Frankenstein', additionalInfo: 'Scientist', days: 'MTWR' },
    { id: 23, name: 'Walter White', additionalInfo: 'Chemistry Teacher', days: 'TWRF' },
    { id: 24, name: 'Xena Warrior', additionalInfo: 'Warrior Princess', days: 'WRFS' },
    { id: 25, name: 'Yoda', additionalInfo: 'Jedi Master', days: 'RFSU' },
    { id: 26, name: 'Zelda Williams', additionalInfo: 'Actress', days: 'FSUM' },
    { id: 27, name: 'Alice Cooper', additionalInfo: 'Musician', days: 'SUMT' },
    { id: 28, name: 'Bruce Wayne', additionalInfo: 'Businessman', days: 'UMTW' },
    { id: 29, name: 'Clark Kent', additionalInfo: 'Reporter', days: 'MTWR' },
    { id: 30, name: 'Diana Prince', additionalInfo: 'Warrior', days: 'TWRF' },
    { id: 31, name: 'Elon Musk', additionalInfo: 'Entrepreneur', days: 'WRFS' },
    { id: 32, name: 'Frodo Baggins', additionalInfo: 'Hobbit', days: 'RFSU' },
    { id: 33, name: 'Gandalf the Grey', additionalInfo: 'Wizard', days: 'FSUM' },
    { id: 34, name: 'Harry Potter', additionalInfo: 'Wizard', days: 'SUMT' },
    { id: 35, name: 'Ivy League', additionalInfo: 'Scholar', days: 'UMTW' },
    { id: 36, name: 'Jack Sparrow', additionalInfo: 'Pirate', days: 'MTWR' },
    { id: 37, name: 'Katniss Everdeen', additionalInfo: 'Archer', days: 'TWRF' },
    { id: 38, name: 'Lara Croft', additionalInfo: 'Adventurer', days: 'WRFS' },
    { id: 39, name: 'Marty McFly', additionalInfo: 'Time Traveler', days: 'RFSU' },
    { id: 40, name: 'Zoe Saldaña', additionalInfo: 'Data Analyst', days: 'UMTW' },
    { id: 41, name: 'Neymar Jr.', additionalInfo: 'Soccer Player', days: 'MTWR' },
    { id: 42, name: 'Lionel Messi', additionalInfo: 'Soccer Player', days: 'TWRF' },
    { id: 43, name: 'Cristiano Ronaldo', additionalInfo: 'Soccer Player', days: 'WRFS' },
    { id: 44, name: 'Kylian Mbappé', additionalInfo: 'Soccer Player', days: 'RFSU' },
    { id: 45, name: 'Mohamed Salah', additionalInfo: 'Soccer Player', days: 'FSUM' },
    { id: 46, name: 'Sadio Mané', additionalInfo: 'Soccer Player', days: 'SUMT' },
    { id: 47, name: 'Kevin De Bruyne', additionalInfo: 'Soccer Player', days: 'UMTW' },
    { id: 48, name: 'Robert Lewandowski', additionalInfo: 'Soccer Player', days: 'MTWR' },
    { id: 49, name: 'Neymar Jr.', additionalInfo: 'Soccer Player', days: 'TWRF' },
    { id: 50, name: 'Cristiano Ronaldo', additionalInfo: 'Soccer Player', days: 'WRFS' },
    { id: 51, name: 'Lionel Messi', additionalInfo: 'Soccer Player', days: 'RFSU' },
    { id: 52, name: 'Kylian Mbappé', additionalInfo: 'Soccer Player', days: 'FSUM' },
    { id: 53, name: 'Virgil van Dijk', additionalInfo: 'Soccer Player', days: 'MTWR' },
{ id: 54, name: 'Gareth Bale', additionalInfo: 'Soccer Player', days: 'TWRF' },
{ id: 55, name: 'Paul Pogba', additionalInfo: 'Soccer Player', days: 'WRFS' },
{ id: 56, name: 'Raheem Sterling', additionalInfo: 'Soccer Player', days: 'RFSU' },
{ id: 57, name: 'Son Heung-min', additionalInfo: 'Soccer Player', days: 'FSUM' },
{ id: 58, name: 'Luka Modrić', additionalInfo: 'Soccer Player', days: 'SUMT' },
{ id: 59, name: 'Harry Kane', additionalInfo: 'Soccer Player', days: 'UMTW' },
{ id: 60, name: 'Gianluigi Donnarumma', additionalInfo: 'Soccer Player', days: 'MTWR' },
{ id: 61, name: 'Antoine Griezmann', additionalInfo: 'Soccer Player', days: 'TWRF' },
{ id: 62, name: 'Ederson', additionalInfo: 'Soccer Player', days: 'WRFS' },
{ id: 63, name: 'Sergio Ramos', additionalInfo: 'Soccer Player', days: 'RFSU' },
{ id: 64, name: 'Zlatan Ibrahimović', additionalInfo: 'Soccer Player', days: 'FSUM' },
{ id: 65, name: 'César Azpilicueta', additionalInfo: 'Soccer Player', days: 'SUMT' },
{ id: 66, name: 'N’Golo Kanté', additionalInfo: 'Soccer Player', days: 'UMTW' },
{ id: 67, name: 'Bruno Fernandes', additionalInfo: 'Soccer Player', days: 'MTWR' },
{ id: 68, name: 'João Félix', additionalInfo: 'Soccer Player', days: 'TWRF' },
{ id: 69, name: 'Frenkie de Jong', additionalInfo: 'Soccer Player', days: 'WRFS' },
{ id: 70, name: 'Phil Foden', additionalInfo: 'Soccer Player', days: 'RFSU' },
{ id: 71, name: 'Jadon Sancho', additionalInfo: 'Soccer Player', days: 'FSUM' },
{ id: 72, name: 'Marcus Rashford', additionalInfo: 'Soccer Player', days: 'SUMT' },
{ id: 73, name: 'Toni Kroos', additionalInfo: 'Soccer Player', days: 'UMTW' },
{ id: 74, name: 'David De Gea', additionalInfo: 'Soccer Player', days: 'MTWR' },
{ id: 75, name: 'Alisson Becker', additionalInfo: 'Soccer Player', days: 'TWRF' },
{ id: 76, name: 'Kepa Arrizabalaga', additionalInfo: 'Soccer Player', days: 'WRFS' },
{ id: 77, name: 'Nicolas Pépé', additionalInfo: 'Soccer Player', days: 'RFSU' },
{ id: 78, name: 'Ousmane Dembélé', additionalInfo: 'Soccer Player', days: 'FSUM' },
{ id: 79, name: 'Christian Pulisic', additionalInfo: 'Soccer Player', days: 'SUMT' },
{ id: 80, name: 'Gavi', additionalInfo: 'Soccer Player', days: 'UMTW' },
{ id: 81, name: 'Pedri', additionalInfo: 'Soccer Player', days: 'MTWR' },
{ id: 82, name: 'Declan Rice', additionalInfo: 'Soccer Player', days: 'TWRF' },
{ id: 83, name: 'Jack Grealish', additionalInfo: 'Soccer Player', days: 'WRFS' },
{ id: 84, name: 'Youssoufa Moukoko', additionalInfo: 'Soccer Player', days: 'RFSU' },
{ id: 85, name: 'Alphonso Davies', additionalInfo: 'Soccer Player', days: 'FSUM' },
{ id: 86, name: 'Achraf Hakimi', additionalInfo: 'Soccer Player', days: 'SUMT' },
{ id: 87, name: 'Reece James', additionalInfo: 'Soccer Player', days: 'UMTW' },
{ id: 88, name: 'Philippe Coutinho', additionalInfo: 'Soccer Player', days: 'MTWR' },
{ id: 89, name: 'Álvaro Morata', additionalInfo: 'Soccer Player', days: 'TWRF' },
{ id: 90, name: 'Giorgio Chiellini', additionalInfo: 'Soccer Player', days: 'WRFS' },
{ id: 91, name: 'Ciro Immobile', additionalInfo: 'Soccer Player', days: 'RFSU' },
{ id: 92, name: 'Lorenzo Insigne', additionalInfo: 'Soccer Player', days: 'FSUM' },
{ id: 93, name: 'Federico Chiesa', additionalInfo: 'Soccer Player', days: 'SUMT' },
{ id: 94, name: 'Jorginho', additionalInfo: 'Soccer Player', days: 'UMTW' },
{ id: 95, name: 'Leonardo Bonucci', additionalInfo: 'Soccer Player', days: 'MTWR' },
{ id: 96, name: 'Gianluigi Buffon', additionalInfo: 'Soccer Player', days: 'TWRF' },
{ id: 97, name: 'Marco Verratti', additionalInfo: 'Soccer Player', days: 'WRFS' },
{ id: 98, name: 'Luis Suárez', additionalInfo: 'Soccer Player', days: 'RFSU' },
{ id: 99, name: 'Karim Benzema', additionalInfo: 'Soccer Player', days: 'FSUM' },
{ id: 100, name: 'Eden Hazard', additionalInfo: 'Soccer Player', days: 'SUMT' },
{ id: 101, name: 'Vinícius Júnior', additionalInfo: 'Soccer Player', days: 'UMTW' },
{ id: 102, name: 'Saúl Ñíguez', additionalInfo: 'Soccer Player', days: 'MTWR' },
{ id: 103, name: 'Gavi', additionalInfo: 'Soccer Player', days: 'TWRF' },
{ id: 104, name: 'Ousmane Dembélé', additionalInfo: 'Soccer Player', days: 'WRFS' },
{ id: 105, name: 'David Silva', additionalInfo: 'Soccer Player', days: 'RFSU' },
{ id: 106, name: 'Andrés Iniesta', additionalInfo: 'Soccer Player', days: 'FSUM' },
{ id: 107, name: 'Thiago Alcântara', additionalInfo: 'Soccer Player', days: 'SUMT' },
{ id: 108, name: 'Serge Gnabry', additionalInfo: 'Soccer Player', days: 'UMTW' },
{ id: 109, name: 'Joshua Kimmich', additionalInfo: 'Soccer Player', days: 'MTWR' },
{ id: 110, name: 'Leon Goretzka', additionalInfo: 'Soccer Player', days: 'TWRF' },
{ id: 111, name: 'Timo Werner', additionalInfo: 'Soccer Player', days: 'WRFS' },
{ id: 112, name: 'Nico Schlotterbeck', additionalInfo: 'Soccer Player', days: 'RFSU' },
{ id: 113, name: 'Jamal Musiala', additionalInfo: 'Soccer Player', days: 'FSUM' },
{ id: 114, name: 'Marco Asensio', additionalInfo: 'Soccer Player', days: 'SUMT' },
{ id: 115, name: 'Rodrygo', additionalInfo: 'Soccer Player', days: 'UMTW' },
{ id: 116, name: 'Isco', additionalInfo: 'Soccer Player', days: 'MTWR' },
{ id: 117, name: 'Dani Olmo', additionalInfo: 'Soccer Player', days: 'TWRF' },
{ id: 118, name: 'Gerard Moreno', additionalInfo: 'Soccer Player', days: 'WRFS' },
{ id: 119, name: 'Mikel Oyarzabal', additionalInfo: 'Soccer Player', days: 'RFSU' },
{ id: 120, name: 'Ander Herrera', additionalInfo: 'Soccer Player', days: 'FSUM' },
{ id: 121, name: 'Fabián Ruiz', additionalInfo: 'Soccer Player', days: 'SUMT' },
{ id: 122, name: 'Marcos Llorente', additionalInfo: 'Soccer Player', days: 'UMTW' },
{ id: 123, name: 'Pau Torres', additionalInfo: 'Soccer Player', days: 'MTWR' },
{ id: 124, name: 'Sergio Busquets', additionalInfo: 'Soccer Player', days: 'TWRF' },
{ id: 125, name: 'Cesc Fàbregas', additionalInfo: 'Soccer Player', days: 'WRFS' },
{ id: 126, name: 'Álvaro Odriozola', additionalInfo: 'Soccer Player', days: 'RFSU' },
{ id: 127, name: 'Dani Carvajal', additionalInfo: 'Soccer Player', days: 'FSUM' },
{ id: 128, name: 'Iker Casillas', additionalInfo: 'Soccer Player', days: 'SUMT' },
{ id: 129, name: 'Fernando Torres', additionalInfo: 'Soccer Player', days: 'UMTW' },
{ id: 130, name: 'Xavi Hernández', additionalInfo: 'Soccer Player', days: 'MTWR' },
{ id: 131, name: 'Carlos Puyol', additionalInfo: 'Soccer Player', days: 'TWRF' },
{ id: 132, name: 'David Villa', additionalInfo: 'Soccer Player', days: 'WRFS' },
{ id: 133, name: 'Gerard Piqué', additionalInfo: 'Soccer Player', days: 'RFSU' },
{ id: 134, name: 'Raúl González', additionalInfo: 'Soccer Player', days: 'FSUM' },
{ id: 135, name: 'Luis Figo', additionalInfo: 'Soccer Player', days: 'SUMT' },
{ id: 136, name: 'Rui Costa', additionalInfo: 'Soccer Player', days: 'UMTW' },
{ id: 137, name: 'Ronaldo Nazário', additionalInfo: 'Soccer Player', days: 'MTWR' },
{ id: 138, name: 'Zico', additionalInfo: 'Soccer Player', days: 'TWRF' },
{ id: 139, name: 'Diego Maradona', additionalInfo: 'Soccer Player', days: 'WRFS' },
{ id: 140, name: 'Pelé', additionalInfo: 'Soccer Player', days: 'RFSU' },
{ id: 141, name: 'Michael Owen', additionalInfo: 'Soccer Player', days: 'FSUM' },
{ id: 142, name: 'John Terry', additionalInfo: 'Soccer Player', days: 'SUMT' },
{ id: 143, name: 'Frank Lampard', additionalInfo: 'Soccer Player', days: 'UMTW' },
{ id: 144, name: 'Gareth Bale', additionalInfo: 'Soccer Player', days: 'MTWR' },
{ id: 145, name: 'Thierry Henry', additionalInfo: 'Soccer Player', days: 'TWRF' },
{ id: 146, name: 'Robin van Persie', additionalInfo: 'Soccer Player', days: 'WRFS' },
{ id: 147, name: 'Dennis Bergkamp', additionalInfo: 'Soccer Player', days: 'RFSU' },
{ id: 148, name: 'Pele', additionalInfo: 'Soccer Player', days: 'FSUM' },
{ id: 149, name: 'Diego Forlán', additionalInfo: 'Soccer Player', days: 'SUMT' },
{ id: 150, name: 'Luka Modrić', additionalInfo: 'Soccer Player', days: 'UMTW' },
{ id: 151, name: 'Andrés Iniesta', additionalInfo: 'Soccer Player', days: 'MTWR' },
{ id: 152, name: 'Zlatan Ibrahimović', additionalInfo: 'Soccer Player', days: 'TWRF' },
{ id: 153, name: 'Samuel Eto\'o', additionalInfo: 'Soccer Player', days: 'WRFS' },
{ id: 154, name: 'Carles Puyol', additionalInfo: 'Soccer Player', days: 'RFSU' },
{ id: 155, name: 'Gerard Piqué', additionalInfo: 'Soccer Player', days: 'FSUM' },
{ id: 156, name: 'César Azpilicueta', additionalInfo: 'Soccer Player', days: 'SUMT' },
{ id: 157, name: 'Vincent Kompany', additionalInfo: 'Soccer Player', days: 'UMTW' },
{ id: 158, name: 'Sergio Ramos', additionalInfo: 'Soccer Player', days: 'MTWR' },
{ id: 159, name: 'Philippe Coutinho', additionalInfo: 'Soccer Player', days: 'TWRF' },
{ id: 160, name: 'Neymar Jr.', additionalInfo: 'Soccer Player', days: 'WRFS' },
{ id: 161, name: 'Roberto Firmino', additionalInfo: 'Soccer Player', days: 'RFSU' },
{ id: 162, name: 'Gabriel Jesus', additionalInfo: 'Soccer Player', days: 'FSUM' },
{ id: 163, name: 'Richarlison', additionalInfo: 'Soccer Player', days: 'SUMT' },
{ id: 164, name: 'Marcelo', additionalInfo: 'Soccer Player', days: 'UMTW' },
{ id: 165, name: 'David Alaba', additionalInfo: 'Soccer Player', days: 'MTWR' },
{ id: 166, name: 'Edinson Cavani', additionalInfo: 'Soccer Player', days: 'TWRF' },
{ id: 167, name: 'Angel Di Maria', additionalInfo: 'Soccer Player', days: 'WRFS' },
{ id: 168, name: 'James Rodríguez', additionalInfo: 'Soccer Player', days: 'RFSU' },
{ id: 169, name: 'Nico Elvedi', additionalInfo: 'Soccer Player', days: 'FSUM' },
{ id: 170, name: 'Julian Brandt', additionalInfo: 'Soccer Player', days: 'SUMT' },
{ id: 171, name: 'Christian Pulisic', additionalInfo: 'Soccer Player', days: 'UMTW' },
{ id: 172, name: 'Tim Weah', additionalInfo: 'Soccer Player', days: 'MTWR' },
{ id: 173, name: 'Josh Sargent', additionalInfo: 'Soccer Player', days: 'TWRF' },
{ id: 174, name: 'Zack Steffen', additionalInfo: 'Soccer Player', days: 'WRFS' },
{ id: 175, name: 'Tyler Adams', additionalInfo: 'Soccer Player', days: 'RFSU' },
{ id: 176, name: 'Sergi Roberto', additionalInfo: 'Soccer Player', days: 'FSUM' },
{ id: 177, name: 'Frenkie de Jong', additionalInfo: 'Soccer Player', days: 'SUMT' },
{ id: 178, name: 'Ansu Fati', additionalInfo: 'Soccer Player', days: 'UMTW' },
{ id: 179, name: 'Ruben Dias', additionalInfo: 'Soccer Player', days: 'MTWR' },
{ id: 180, name: 'Bernardo Silva', additionalInfo: 'Soccer Player', days: 'TWRF' },
{ id: 181, name: 'João Cancelo', additionalInfo: 'Soccer Player', days: 'WRFS' },
{ id: 182, name: 'Riyad Mahrez', additionalInfo: 'Soccer Player', days: 'RFSU' },
{ id: 183, name: 'Phil Foden', additionalInfo: 'Soccer Player', days: 'FSUM' },
{ id: 184, name: 'Emile Smith Rowe', additionalInfo: 'Soccer Player', days: 'SUMT' },
{ id: 185, name: 'Mason Mount', additionalInfo: 'Soccer Player', days: 'UMTW' },
{ id: 186, name: 'Bukayo Saka', additionalInfo: 'Soccer Player', days: 'MTWR' },
{ id: 187, name: 'Jadon Sancho', additionalInfo: 'Soccer Player', days: 'TWRF' },
{ id: 188, name: 'Callum Hudson-Odoi', additionalInfo: 'Soccer Player', days: 'WRFS' },
{ id: 189, name: 'Marcus Rashford', additionalInfo: 'Soccer Player', days: 'RFSU' },
{ id: 190, name: 'Harry Kane', additionalInfo: 'Soccer Player', days: 'FSUM' },

  ]);

  // State for selected day filter
  const [selectedDay, setSelectedDay] = useState('');

  // Define color mapping for days
  const dayColorMap = {
    M: '#FF5733', // Monday
    T: '#33FF57', // Tuesday
    W: '#3357FF', // Wednesday
    R: '#FF33A1', // Thursday
    F: '#FFBD33', // Friday
    S: '#33FFF3', // Saturday
    U: '#FF33E6', // Sunday
  };

  const handleDragStart = (e, assignment) => {
    e.dataTransfer.setData('assignment', JSON.stringify(assignment));
  };

  const handleDrop = (e, table, aisle) => {
    const assignmentData = e.dataTransfer.getData('assignment');
    const assignment = JSON.parse(assignmentData);

    // Add assignment to the specific table and aisle
    setAssignments((prevAssignments) => {
      const updatedAssignments = {
        ...prevAssignments,
        [table]: {
          ...prevAssignments[table],
          [aisle]: [...prevAssignments[table][aisle], assignment],
        },
      };
      return updatedAssignments;
    });

    // Remove the assignment from the pending assignments
    setPendingAssignments((prevPending) => {
      return prevPending.filter((a) => a.id !== assignment.id);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const filterAssignmentsByDays = (assignments, day) => {
    return assignments.filter((assignment) => assignment.days.includes(day));
  };

  return (
    <div>
        <WarehouseTable />
     
    </div>
  );
};

export default DraggableAssignmentTable;
