import React from 'react';
import './Header.scss';

const Header = () => {
  return (
    <header className="header">
      <nav>
        <ul>
          <li><a href="#about">About</a></li>
          <li><a href="#skills">Skills</a></li>
          <li><a href="#projects">Projects</a></li>
          <li><a href="#contact">Contact</a></li>
          <li><a href="#resume">Resume</a></li>
        </ul>
      </nav>
      <div className="toggle">
        <i className="fa fa-moon-o"></i>
      </div>
    </header>
  );
};

export default Header;
