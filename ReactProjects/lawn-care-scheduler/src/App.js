import React from "react";
import EmployeeList from "./EmployeeList";
import Scheduler from "./Scheduler";
import ReactDOM from "react-dom";



export default function App(){
  return (
    <div>
      <EmployeeList />
      <Scheduler />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
