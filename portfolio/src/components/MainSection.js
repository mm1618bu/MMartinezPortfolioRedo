import React from 'react';
import './MainSection.scss';
import Headshot from './Headshot.png';

const MainSection = () => {
  return (
    <section className="main-section">
      <div className="text">
        <h1>Hello! My Name is </h1>
        <br></br>
        <h2>Mitchell Martinez</h2>
        <br></br>
        <h3>Software Developer <span>|</span> Full Stack Engineer</h3>
        <br></br>
        <p>
        Highly motivated recent graduate with a Master's in Computer Information Systems (Web Development) seeking a full-stack developer role. Proven ability to leverage React.js, Java (Spring Boot), and MongoDB to build innovative and user-centric web applications. Experience in technical support and intranet system development.
        </p>
        <br></br>
        <a href="#resume" className="btn-resume">My Resume</a>
      </div>
      <div className="profile-pic">
        <img src={Headshot} alt="Mitchell Martinez" />
      </div>
    </section>
  );
};

export default MainSection;
