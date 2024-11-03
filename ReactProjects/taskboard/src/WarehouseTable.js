import React, { useState } from 'react';

const WarehouseTable = () => {
  const SHIFT1 = "Mon, Tue, Wed, Thu";
  const SHIFT2 = "Tue, Wed, Thu, Fri";
  const SHIFT3 = "Wed, Thu, Fri, Sat";
  const SHIFT4 = "Thu, Fri, Sat, Sun";
  const SHIFT5 = "Fri, Sat, Sun, Mon";
  const SHIFT6 = "Sat, Sun, Mon, Tue";
  const SHIFT7 = "Sun, Mon, Tue, Wed";

  const SHIFTColors = {
    [SHIFT1]: '#FFDDC1',
    [SHIFT2]: '#C1E1FF',
    [SHIFT3]: '#C1FFC1',
    [SHIFT4]: '#FFC1C1',
    [SHIFT5]: '#FFFFC1',
    [SHIFT6]: '#E1C1FF',
    [SHIFT7]: '#C1FFE1',
  };

  const nameTags = 
    [
      { id: 1, name: 'John Doe', days: SHIFT1 },
      { id: 2, name: '', days: SHIFT1 },
      { id: 3, name: 'Jane Doe', days: SHIFT2 },
      { id: 4, name: 'Alice', days: SHIFT3 },
      { id: 5, name: 'Bob', days: SHIFT4 },
      { id: 6, name: 'Charlie', days:SHIFT5},
      { id: 7, name: 'David', days: SHIFT6 },
      { id: 8, name: 'Eve', days: SHIFT7 },
      { id: 9, name: 'Frank', days: SHIFT1 },
      { id: 10, name: 'Grace', days: SHIFT2 },
      { id: 11, name: 'Helen', days: SHIFT3 },
      { id: 12, name: 'Ivy', days: SHIFT4 },
      { id: 13, name: 'Jack', days: SHIFT5 },
      { id: 14, name: 'Kelly', days: SHIFT6 },
      { id: 15, name: 'Liam', days: SHIFT7 },
      { id: 16, name: 'Mia', days: SHIFT1 },
      { id: 17, name: 'Noah', days: SHIFT2 },
      { id: 18, name: 'Olivia', days: SHIFT3 },
      { id: 19, name: 'Peter', days: SHIFT4 },
      { id: 20, name: 'Quinn', days: SHIFT5 },
      { id: 21, name: 'Rose', days: SHIFT6 },
      { id: 22, name: 'Sam', days: SHIFT7 },
      { id: 23, name: 'Tina', days: SHIFT1 },
      { id: 24, name: 'Uma', days: SHIFT2 },
      { id: 25, name: 'Victor', days: SHIFT3 },
      { id: 26, name: 'Wendy', days: SHIFT4 },
      { id: 27, name: 'Xavier', days: SHIFT5 },
      { id: 28, name: 'Yara', days: SHIFT6 },
      { id: 29, name: 'Zara', days: SHIFT7 },
      { id: 30, name: 'Adam', days: SHIFT1 },
      { id: 31, name: 'Bella', days: SHIFT2 },
      { id: 32, name: 'Chris', days: SHIFT3 },
      { id: 33, name: 'Daisy', days: SHIFT4 },
      { id: 34, name: 'Ethan', days: SHIFT5 },
      { id: 35, name: 'Fiona', days: SHIFT6 },
      { id: 36, name: 'George', days: SHIFT7 },
      { id: 37, name: 'Hannah', days: SHIFT1 },
      { id: 38, name: 'Ian', days: SHIFT2 },
      { id: 39, name: 'Jenny', days: SHIFT3 },
      { id: 40, name: 'Kane', days: SHIFT4 },
      { id: 41, name: 'Lily', days: SHIFT5 },
      { id: 42, name: 'Mike', days: SHIFT6 },
      { id: 43, name: 'Nina', days: SHIFT7 },
      { id: 44, name: 'Oscar', days: SHIFT1 },
      { id: 45, name: 'Pam', days: SHIFT2 },
      { id: 46, name: 'Quentin', days: SHIFT3 },
      { id: 47, name: 'Rachel', days: SHIFT4 },
      { id: 48, name: 'Steve', days: SHIFT5 },
      { id: 49, name: 'Tara', days: SHIFT6 },
      { id: 50, name: 'Ursula', days: SHIFT7 },
      { id: 51, name: 'Vince', days: SHIFT1 },
      { id: 52, name: 'Walter', days: SHIFT2 },
      { id: 53, name: 'Xena', days: SHIFT3 },
      { id: 54, name: 'Yvonne', days: SHIFT4 },
      { id: 55, name: 'Zack', days: SHIFT5 },
      { id: 56, name: 'Amy', days: SHIFT6 },
      { id: 57, name: 'Ben', days: SHIFT7 },
      { id: 58, name: 'Cathy', days: SHIFT1 },
      { id: 59, name: 'Derek', days: SHIFT2 },
      { id: 60, name: 'Emily', days: SHIFT3 },
      { id: 61, name: 'Franklin', days: SHIFT4 },
      { id: 62, name: 'Gina', days: SHIFT5 },
      { id: 63, name: 'Harry', days: SHIFT6 },
      { id: 64, name: 'Iris', days: SHIFT7 },
      { id: 65, name: 'Jackie', days: SHIFT1 },
      { id: 66, name: 'Kurt', days: SHIFT2 },
      { id: 67, name: 'Linda', days: SHIFT3 },
      { id: 68, name: 'Mason', days: SHIFT4 },
      { id: 69, name: 'Nancy', days: SHIFT5 },
      { id: 70, name: 'Owen', days: SHIFT6 },
      { id: 71, name: 'Patty', days: SHIFT7 },
      { id: 72, name: 'Quincy', days: SHIFT1 },
      { id: 73, name: 'Rita', days: SHIFT2 },
      { id: 74, name: 'Sammy', days: SHIFT3 },
      { id: 75, name: 'Tom', days: SHIFT4 },
      { id: 76, name: 'Ursula', days: SHIFT5 },
      { id: 77, name: 'Vince', days: SHIFT6 },
      { id: 78, name: 'Wendy', days: SHIFT7 },
      { id: 79, name: 'Xavier', days: SHIFT1 },
      { id: 80, name: 'Yara', days: SHIFT2 },
      { id: 81, name: 'Zara', days: SHIFT3 },
      { id: 82, name: 'Adam', days: SHIFT4 },
      { id: 83, name: 'Bella', days: SHIFT5 },
      { id: 84, name: 'Chris', days: SHIFT6 },
      { id: 85, name: 'Daisy', days: SHIFT7 },
      { id: 86, name: 'Ethan', days: SHIFT1 },
      { id: 87, name: 'Fiona', days: SHIFT2 },
      { id: 88, name: 'George', days: SHIFT3 },
      { id: 89, name: 'Hannah', days: SHIFT4 },
      { id: 90, name: 'Ian', days: SHIFT5 },
      { id: 91, name: 'Jenny', days: SHIFT6 },
      { id: 92, name: 'Kane', days: SHIFT7 },
      { id: 93, name: 'Lily', days: SHIFT1 },
      { id: 94, name: 'Mike', days: SHIFT2 },
      { id: 95, name: 'Nina', days: SHIFT3 },
      { id: 96, name: 'Oscar', days: SHIFT4 },
      { id: 97, name: 'Pam', days: SHIFT5 },
      { id: 98, name: 'Quentin', days: SHIFT6 },
      { id: 99, name: 'Rachel', days: SHIFT7 },
      { id: 100, name: 'Steve', days: SHIFT1 },
      { id: 101, name: 'Tara', days: SHIFT2 },
      { id: 102, name: 'Ursula', days: SHIFT3 },
      { id: 103, name: 'Vince', days: SHIFT4 },
      { id: 104, name: 'Walter', days: SHIFT5 },
      { id: 105, name: 'Xena', days: SHIFT6 },
      { id: 106, name: 'Yvonne', days: SHIFT7 },
      { id: 107, name: 'Zack', days: SHIFT1 },
      { id: 108, name: 'Amy', days: SHIFT2 },
      { id: 109, name: 'Ben', days: SHIFT3 },
      { id: 110, name: 'Cathy', days: SHIFT4 },
      { id: 111, name: 'Derek', days: SHIFT5 },
      { id: 112, name: 'Emily', days: SHIFT6 },
      { id: 113, name: 'Franklin', days: SHIFT7 },
      { id: 114, name: 'Gina', days: SHIFT1 },
      { id: 115, name: 'Harry', days: SHIFT2 },
      { id: 116, name: 'Iris', days: SHIFT3 },
      { id: 117, name: 'Jackie', days: SHIFT4 },
      { id: 118, name: 'Kurt', days: SHIFT5 },
      { id: 119, name: 'Linda', days: SHIFT6 },
      { id: 120, name: 'Mason', days: SHIFT7 },
      { id: 121, name: 'Nancy', days: SHIFT1 },
      { id: 122, name: 'Owen', days: SHIFT2 },
      { id: 123, name: 'Patty', days: SHIFT3 },
      { id: 124, name: 'Quincy', days: SHIFT4 },
      { id: 125, name: 'Rita', days: SHIFT5 },
      { id: 126, name: 'Sammy', days: SHIFT6 },
      { id: 127, name: 'Tom', days: SHIFT7 },
      { id: 128, name: 'Ursula', days: SHIFT1 },
      { id: 129, name: 'Vince', days: SHIFT2 },
      { id: 130, name: 'Wendy', days: SHIFT3 },
      { id: 131, name: 'Xavier', days: SHIFT4 },
      { id: 132, name: 'Yara', days: SHIFT5 },
      { id: 133, name: 'Zara', days: SHIFT6 },
      { id: 134, name: 'Adam', days: SHIFT7 },
      { id: 135, name: 'Bella', days: SHIFT1 },
      { id: 136, name: 'Chris', days: SHIFT2 },
      { id: 137, name: 'Daisy', days: SHIFT3 },
      { id: 138, name: 'Ethan', days: SHIFT4 },
      { id: 139, name: 'Fiona', days: SHIFT5 },
      { id: 140, name: 'George', days: SHIFT6 },
      { id: 141, name: 'Hannah', days: SHIFT7 },
      { id: 142, name: 'Ian', days: SHIFT1 },
      { id: 143, name: 'Jenny', days: SHIFT2 },
      { id: 144, name: 'Kane', days: SHIFT3 },
      { id: 145, name: 'Lily', days: SHIFT4 },
      { id: 146, name: 'Mike', days: SHIFT5 },
      { id: 147, name: 'Nina', days: SHIFT6 },
      { id: 148, name: 'Oscar', days: SHIFT7 },
      { id: 149, name: 'Pam', days: SHIFT1 },
      { id: 150, name: 'Quentin', days: SHIFT2 }

    // additional entries as required
  ];

  const [selectedDay, setSelectedDay] = useState('');
  const [mainTableData, setMainTableData] = useState({
    clusterA: { 'A1-A6': { stow: '', pick: '' }, 'A7-A12': { stow: '', pick: '' }, 'A13-A18': { stow: '', pick: '' }, 'A19-A24': { stow: '', pick: '' }, 'A25-A26': { stow: '', pick: '' } },
    clusterB: { 'B1-B6': { stow: '', pick: '' }, 'B7-B12': { stow: '', pick: '' }, 'B13-B18': { stow: '', pick: '' }, 'B19-B24': { stow: '', pick: '' }, 'B25-B26': { stow: '', pick: '' } },
    clusterC: { 'C1-C6': { stow: '', pick: '' }, 'C7-C12': { stow: '', pick: '' }, 'C13-C18': { stow: '', pick: '' }, 'C19-C24': { stow: '', pick: '' }, 'C25-C26': { stow: '', pick: '' } },
    clusterD: { 'D1-D6': { stow: '', pick: '' }, 'D7-D12': { stow: '', pick: '' }, 'D13-D18': { stow: '', pick: '' }, 'D19-D24': { stow: '', pick: '' }, 'D25-D26': { stow: '', pick: '' } },
    clusterE: { 'E1-E6': { stow: '', pick: '' }, 'E7-E12': { stow: '', pick: '' }, 'E13-E18': { stow: '', pick: '' }, 'E19-E24': { stow: '', pick: '' }, 'E25-E26': { stow: '', pick: '' } },
    clusterG: { 'G1-G6': { stow: '', pick: '' }, 'G7-G12': { stow: '', pick: '' }, 'G13-G18': { stow: '', pick: '' }, 'G19-G24': { stow: '', pick: '' }, 'G25-G26': { stow: '', pick: '' } },
    clusterH: { 'H1-H6': { stow: '', pick: '' }, 'H7-H12': { stow: '', pick: '' }, 'H13-H18': { stow: '', pick: '' }, 'H19-H24': { stow: '', pick: '' }, 'H25-H26': { stow: '', pick: '' } },
    clusterJ: { 'J1-J6': { stow: '', pick: '' }, 'J7-J12': { stow: '', pick: '' }, 'J13-J18': { stow: '', pick: '' }, 'J19-J24': { stow: '', pick: '' }, 'J25-J26': { stow: '', pick: '' } },
  });

  const [secondaryTableData, setSecondaryTableData] = useState({
    A: ['', '', '', '', '', '', '', '', '', ''],
    B: ['', '', '', '', '', '', '', '', '', ''],
    C: ['', '', '', '', '', '', '', '', '', ''],
  });

  const handleDragStart = (e, name) => e.dataTransfer.setData('text', name);

  const handleDropMainTable = (e, cluster, area, type) => {
    e.preventDefault();
    const name = e.dataTransfer.getData('text');
    setMainTableData((prev) => ({
      ...prev,
      [cluster]: { ...prev[cluster], [area]: { ...prev[cluster][area], [type]: name } },
    }));
  };

  const handleDropSecondaryTable = (e, row, colIndex) => {
    e.preventDefault();
    const name = e.dataTransfer.getData('text');
    setSecondaryTableData((prev) => ({
      ...prev,
      [row]: prev[row].map((val, idx) => (idx === colIndex ? name : val)),
    }));
  };

  const handleDragOver = (e) => e.preventDefault();

 // Filter and sort name tags based on selected day
const filteredNameTags = selectedDay
? nameTags.filter((tag) => tag.days.includes(selectedDay))
: nameTags;

// Sort the filtered list alphabetically by name
const sortedNameTags = filteredNameTags.sort((a, b) =>
a.name.localeCompare(b.name)
);

// Group sorted name tags by SHIFT for color coding
const groupedNameTags = sortedNameTags.reduce((acc, tag) => {
if (!acc[tag.days]) acc[tag.days] = [];
acc[tag.days].push(tag);
return acc;
}, {});

  return (
    <div>
      {/* Day Filter Dropdown */}
      <div style={{ marginBottom: '20px' }}>
        <label>Select Day: </label>
        <select onChange={(e) => setSelectedDay(e.target.value)} value={selectedDay}>
          <option value="">All Days</option>
          <option value="Mon">Monday</option>
          <option value="Tue">Tuesday</option>
          <option value="Wed">Wednesday</option>
          <option value="Thu">Thursday</option>
          <option value="Fri">Friday</option>
          <option value="Sat">Saturday</option>
          <option value="Sun">Sunday</option>
        </select>
      </div>

      {/* Name Tags Section */}
      <div className="draggable-stacks" style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        {Object.keys(groupedNameTags).map((SHIFT) => (
          <div key={SHIFT} style={{ border: '1px solid black', padding: '10px', borderRadius: '5px', backgroundColor: SHIFTColors[SHIFT] }}>
            <h4>{SHIFT}</h4>
            {groupedNameTags[SHIFT].map((tag) => (
              <p
                key={tag.id}
                draggable
                onDragStart={(e) => handleDragStart(e, tag.name)}
                style={{
                  padding: '6px',
                  border: '1px solid black',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  backgroundColor: SHIFTColors[SHIFT],
                  marginBottom: '-25px',
                }}
              >
                {tag.name}
              </p>
            ))}
          </div>
        ))}
      </div>

      {/* Main Table for Clusters */}
      <div style={containerStyle}>
        {Object.keys(mainTableData).map((clusterKey) => (
          <div key={clusterKey}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={headerCellStyle} colSpan="3">{clusterKey.toUpperCase()}</th>
                </tr>
                <tr>
                  <td style={tableCellStyle}>Area</td>
                  <td style={tableCellStyle}>Stow</td>
                  <td style={tableCellStyle}>Pick</td>
                </tr>
              </thead>
              <tbody>
                {Object.keys(mainTableData[clusterKey]).map((area) => (
                  <tr key={area}>
                    <td style={tableCellStyle}>{area}</td>
                    <td
                      style={tableCellStyle}
                      onDrop={(e) => handleDropMainTable(e, clusterKey, area, 'stow')}
                      onDragOver={handleDragOver}
                    >
                      {mainTableData[clusterKey][area].stow}
                    </td>
                    <td
                      style={tableCellStyle}
                      onDrop={(e) => handleDropMainTable(e, clusterKey, area, 'pick')}
                      onDragOver={handleDragOver}
                    >
                      {mainTableData[clusterKey][area].pick}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Secondary Table for Rows A and B */}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={headerCellStyle}>Task</th>
            <th style={headerCellStyle}>Divert 1</th>
            <th style={headerCellStyle}>Divert 2</th>
            <th style={headerCellStyle}>GA1 Load, Scan</th>
            <th style={headerCellStyle}>GA2 Load, Scan</th>
            <th style={headerCellStyle}>GA3 Load, Scan</th>
            <th style={headerCellStyle}>GA4 Load, Scan</th>
            <th style={headerCellStyle}>ASL1 Load, Striaghten</th>
            <th style={headerCellStyle}>ASL2 Load, Striaghten</th>
            <th style={headerCellStyle}>ASL3 Load, Striaghten</th>
            <th style={headerCellStyle}>ASL4 Load, Striaghten</th>
          </tr>
        </thead>
        <tbody>
          {['A', 'B', 'C'].map((row) => (
            <tr key={row}>
              <td style={tableCellStyle}>{row}</td>
              {secondaryTableData[row].map((val, colIndex) => (
                <td
                  key={colIndex}
                  style={dropCellStyle}
                  onDrop={(e) => handleDropSecondaryTable(e, row, colIndex)}
                  onDragOver={handleDragOver}
                >
                  {val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const containerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '20px',
};

const tableStyle = {
  borderCollapse: 'collapse',
  width: '100%',
  marginTop: '20px',
};

const headerCellStyle = {
  backgroundColor: 'gray',
  color: 'white',
  padding: '10px',
  border: '1px solid black',
  textAlign: 'center',
};

const tableCellStyle = {
  padding: '10px',
  border: '1px solid black',
  textAlign: 'center',
};

const dropCellStyle = {
  ...tableCellStyle,
  minHeight: '20px',
  backgroundColor: '#f2f2f2',
};

export default WarehouseTable;
