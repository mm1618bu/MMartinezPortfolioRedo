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

  const initialNameTags = [{"id":1,"name":"Benoite Cornelissen","days":SHIFT7},
    {"id":2,"name":"Winn Crathorne","days":SHIFT1},
    {"id":3,"name":"Kassia Benford","days":SHIFT4},
    {"id":4,"name":"Dar Battie","days":SHIFT3},
    {"id":5,"name":"Malorie Handman","days":SHIFT2},
    {"id":6,"name":"Vassily Nettleship","days":SHIFT2},
    {"id":7,"name":"Meg Scoffham","days":SHIFT1},
    {"id":8,"name":"Jermaine Taylder","days":SHIFT7},
    {"id":9,"name":"Austin Davys","days":SHIFT3},
    {"id":10,"name":"Francine Aberdeen","days":SHIFT3},
    {"id":11,"name":"Derry Van der Mark","days":SHIFT1},
    {"id":12,"name":"Silvia Belcher","days":SHIFT7},
    {"id":13,"name":"Curtis Leftwich","days":SHIFT6},
    {"id":14,"name":"Myrwyn Le Sieur","days":SHIFT3},
    {"id":15,"name":"Malissa Leggin","days":SHIFT6},
    {"id":16,"name":"Mart Cockill","days":SHIFT7},
    {"id":17,"name":"Dorine Napoli","days":SHIFT3},
    {"id":18,"name":"Angelique Nouch","days":SHIFT7},
    {"id":19,"name":"Brannon Abbott","days":SHIFT5},
    {"id":20,"name":"Odey Gregs","days":SHIFT5},
    {"id":21,"name":"Carmel McKilroe","days":SHIFT3},
    {"id":22,"name":"Alayne Smedley","days":SHIFT3},
    {"id":23,"name":"Alex Laurence","days":SHIFT4},
    {"id":24,"name":"Gertrud Theaker","days":SHIFT6},
    {"id":25,"name":"Kirsten Linnett","days":SHIFT1},
    {"id":26,"name":"Daryl Sculley","days":SHIFT5},
    {"id":27,"name":"Seana Brawley","days":SHIFT3},
    {"id":28,"name":"Dwain Butler","days":SHIFT7},
    {"id":29,"name":"Nadiya Canelas","days":SHIFT6},
    {"id":30,"name":"Hervey Ridding","days":SHIFT6},
    {"id":31,"name":"Kasey Leavey","days":SHIFT4},
    {"id":32,"name":"Frannie Luckman","days":SHIFT1},
    {"id":33,"name":"Brier Rowaszkiewicz","days":SHIFT6},
    {"id":34,"name":"Fanchon Windibank","days":SHIFT4},
    {"id":35,"name":"Cathrine Pittel","days":SHIFT1},
    {"id":36,"name":"Yasmeen Brocklesby","days":SHIFT6},
    {"id":37,"name":"Del Stalman","days":SHIFT2},
    {"id":38,"name":"Saunders Rivalant","days":SHIFT2},
    {"id":39,"name":"Trevar Masser","days":SHIFT5},
    {"id":40,"name":"Marlee Loweth","days":SHIFT3},
    {"id":41,"name":"Winona Daber","days":SHIFT1},
    {"id":42,"name":"Delilah Allatt","days":SHIFT3},
    {"id":43,"name":"Karim Handyside","days":SHIFT1},
    {"id":44,"name":"Timoteo Cowlin","days":SHIFT4},
    {"id":45,"name":"Valerye Lewcock","days":SHIFT1},
    {"id":46,"name":"Fara Heselwood","days":SHIFT4},
    {"id":47,"name":"Nannette Moreinu","days":SHIFT1},
    {"id":48,"name":"Neil Dunrige","days":SHIFT2},
    {"id":49,"name":"Grenville Vinsen","days":SHIFT1},
    {"id":50,"name":"Meredith Stailey","days":SHIFT5},
    {"id":51,"name":"Josepha Snel","days":SHIFT6},
    {"id":52,"name":"Belle Ballay","days":SHIFT6},
    {"id":53,"name":"Livvie Ondracek","days":SHIFT2},
    {"id":54,"name":"Rawley Grimsdike","days":SHIFT5},
    {"id":55,"name":"Shane Storton","days":SHIFT3},
    {"id":56,"name":"Brocky Keningham","days":SHIFT4},
    {"id":57,"name":"Bell Jopp","days":SHIFT1},
    {"id":58,"name":"Augustine Lynskey","days":SHIFT2},
    {"id":59,"name":"Waly Piche","days":SHIFT3},
    {"id":60,"name":"Fulton Behagg","days":SHIFT1},
    {"id":61,"name":"Astrid Hutcheon","days":SHIFT5},
    {"id":62,"name":"Keefe See","days":SHIFT1},
    {"id":63,"name":"Candy Scarlan","days":SHIFT3},
    {"id":64,"name":"Chev Charlton","days":SHIFT1},
    {"id":65,"name":"Kay Margram","days":SHIFT2},
    {"id":66,"name":"Marigold Zoellner","days":SHIFT7},
    {"id":67,"name":"Jaymee Sturton","days":SHIFT3},
    {"id":68,"name":"Edyth Malpass","days":SHIFT5},
    {"id":69,"name":"Sheridan D'Emanuele","days":SHIFT1},
    {"id":70,"name":"Krishna Schutte","days":SHIFT7},
    {"id":71,"name":"Helga Wheway","days":SHIFT7},
    {"id":72,"name":"Florance Horry","days":SHIFT3},
    {"id":73,"name":"Nelle MacCostye","days":SHIFT4},
    {"id":74,"name":"Dorice Povall","days":SHIFT2},
    {"id":75,"name":"Patrizius Elfleet","days":SHIFT7},
    {"id":76,"name":"Marion Baggallay","days":SHIFT1},
    {"id":77,"name":"Lesli Bampkin","days":SHIFT3},
    {"id":78,"name":"Magdaia Devany","days":SHIFT4},
    {"id":79,"name":"Stephanus Skoof","days":SHIFT2},
    {"id":80,"name":"Reinaldo Dewhurst","days":SHIFT5},
    {"id":81,"name":"Griffie Broadstock","days":SHIFT3},
    {"id":82,"name":"Bertram Himsworth","days":SHIFT6},
    {"id":83,"name":"Doralynn Clubb","days":SHIFT4},
    {"id":84,"name":"Adda O' Liddy","days":SHIFT4},
    {"id":85,"name":"Vonny Brandin","days":SHIFT4},
    {"id":86,"name":"Alyce Saphin","days":SHIFT5},
    {"id":87,"name":"Tiebout Meredith","days":SHIFT6},
    {"id":88,"name":"Catharina Braddick","days":SHIFT5},
    {"id":89,"name":"Giacinta Benjefield","days":SHIFT6},
    {"id":90,"name":"Brendan Adamolli","days":SHIFT1},
    {"id":91,"name":"Horst Beatey","days":SHIFT2},
    {"id":92,"name":"Berte Merryfield","days":SHIFT5},
    {"id":93,"name":"Mattias Babon","days":SHIFT7},
    {"id":94,"name":"Elaina Duesbury","days":SHIFT7},
    {"id":95,"name":"Cherrita Demchen","days":SHIFT3},
    {"id":96,"name":"Sephira Rapkins","days":SHIFT1},
    {"id":97,"name":"Rosita Benedict","days":SHIFT3},
    {"id":98,"name":"Tildi McKennan","days":SHIFT3},
    {"id":99,"name":"Kennith Franies","days":SHIFT3},
    {"id":100,"name":"Zahara Renachowski","days":SHIFT5},
    {"id":101,"name":"Enos Gaggen","days":SHIFT6},
    {"id":102,"name":"Beverly Shoorbrooke","days":SHIFT5},
    {"id":103,"name":"Norah Culver","days":SHIFT7},
    {"id":104,"name":"Augie Abdie","days":SHIFT5},
    {"id":105,"name":"Geno Shirley","days":SHIFT1},
    {"id":106,"name":"Reggi Millen","days":SHIFT5},
    {"id":107,"name":"Farlee Alcott","days":SHIFT7},
    {"id":108,"name":"Gerri Crimpe","days":SHIFT3},
    {"id":109,"name":"Wendye Dowdney","days":SHIFT3},
    {"id":110,"name":"Stirling Olenov","days":SHIFT3},
    {"id":111,"name":"Harvey Sevin","days":SHIFT7},
    {"id":112,"name":"Karly Muirden","days":SHIFT5},
    {"id":113,"name":"Margaretha Corson","days":SHIFT7},
    {"id":114,"name":"Hally Fursse","days":SHIFT4},
    {"id":115,"name":"Juana Minucci","days":SHIFT1},
    {"id":116,"name":"Iorgo Darbishire","days":SHIFT2},
    {"id":117,"name":"Renard Gierhard","days":SHIFT5},
    {"id":118,"name":"Kenon Carbert","days":SHIFT5},
    {"id":119,"name":"Jourdain Petchell","days":SHIFT4},
    {"id":120,"name":"Demeter Jozefczak","days":SHIFT6},
    {"id":121,"name":"Avril Coorington","days":SHIFT2},
    {"id":122,"name":"Hamlen Peyto","days":SHIFT3},
    {"id":123,"name":"Ludovika Folke","days":SHIFT1},
    {"id":124,"name":"Laurena Darthe","days":SHIFT7},
    {"id":125,"name":"Shalne Jurn","days":SHIFT1},
    {"id":126,"name":"Drona Corkill","days":SHIFT4},
    {"id":127,"name":"Reilly Rishman","days":SHIFT3},
    {"id":128,"name":"Bertram Ratie","days":SHIFT2},
    {"id":129,"name":"Bobina Moxted","days":SHIFT2},
    {"id":130,"name":"Karlee Matokhnin","days":SHIFT7},
    {"id":131,"name":"Rosabel Hurford","days":SHIFT2},
    {"id":132,"name":"Erv Ivankovic","days":SHIFT4},
    {"id":133,"name":"Traci McIlwrick","days":SHIFT6},
    {"id":134,"name":"Raleigh Hailston","days":SHIFT1},
    {"id":135,"name":"Steffane Cescot","days":SHIFT7},
    {"id":136,"name":"Lothario Bento","days":SHIFT1},
    {"id":137,"name":"Cordula Gayle","days":SHIFT5},
    {"id":138,"name":"Crystal Boriston","days":SHIFT3},
    {"id":139,"name":"Pet Sumner","days":SHIFT6},
    {"id":140,"name":"Philis Heathcote","days":SHIFT1},
    {"id":141,"name":"Cindi Addlestone","days":SHIFT1},
    {"id":142,"name":"Denys Giannassi","days":SHIFT2},
    {"id":143,"name":"Ninetta Berthomier","days":SHIFT3},
    {"id":144,"name":"Thorn Guiton","days":SHIFT4},
    {"id":145,"name":"Demetris Probets","days":SHIFT7},
    {"id":146,"name":"Marlo Speakman","days":SHIFT7},
    {"id":147,"name":"Cilka Reedie","days":SHIFT7},
    {"id":148,"name":"Constantina Duchesne","days":SHIFT6},
    {"id":149,"name":"Alecia Worsom","days":SHIFT5},
    {"id":150,"name":"Carolynn Lissemore","days":SHIFT5}]
    ;

  const [selectedDay, setSelectedDay] = useState('');
  const [nameTags, setNameTags] = useState(initialNameTags);
  const [mainTableData, setMainTableData] = useState({
    clusterA: { 'A1-A6': { stow: '', pick: '' }, 'A7-A12': { stow: '', pick: '' }, 'A13-A18': { stow: '', pick: '' }, 'A19-A24': { stow: '', pick: '' }, 'A25-A26': { stow: '', pick: '' } },
    clusterB: { 'B1-B6': { stow: '', pick: '' }, 'B7-B12': { stow: '', pick: '' }, 'B13-B18': { stow: '', pick: '' }, 'B19-B24': { stow: '', pick: '' }, 'B25-B26': { stow: '', pick: '' } },
    clusterC: { 'C1-C6': { stow: ''}, 'C7-C12': { stow: ''}, 'C13-C18': { stow: '' }, 'C19-C24': { stow: '' }, 'C25-C26': { stow: ''} },
    clusterD: { 'D1-D6': { stow: '', pick: '' }, 'D7-D12': { stow: '', pick: '' }, 'D13-D18': { stow: '', pick: '' }, 'D19-D24': { stow: '', pick: '' }, 'D25-D26': { stow: '', pick: '' } },
    clusterE: { 'E1-E6': { stow: '', pick: '' }, 'E7-E12': { stow: '', pick: '' }, 'E13-E18': { stow: '', pick: '' }, 'E19-E24': { stow: '', pick: '' }, 'E25-E26': { stow: '', pick: '' } },
    clusterG: { 'G1-G6': { stow: '', pick: '' }, 'G7-G12': { stow: '', pick: '' }, 'G13-G18': { stow: '', pick: '' }, 'G19-G24': { stow: '', pick: '' }, 'G25-G26': { stow: '', pick: '' } },
    clusterH: { 'H1-H6': { stow: '', pick: '' }, 'H7-H12': { stow: '', pick: '' }, 'H13-H18': { stow: '', pick: '' }, 'H19-H24': { stow: '', pick: '' }, 'H25-H26': { stow: '', pick: '' } },
    clusterJ: { 'J1-J6': { stow: '', pick: '' }, 'J7-J12': { stow: '', pick: '' }, 'J13-J18': { stow: '', pick: '' }, 'J19-J24': { stow: '', pick: '' }, 'J25-J26': { stow: '', pick: '' } },
  });

  const [secondaryTableData, setSecondaryTableData] = useState({
    A: ['', '', '', '', '', '', '', '', '', '','','',''],
    B: ['', '', '', '', '', '', '', '', '', '','','',''],
    C: ['', '', '', '', '', '', '', '', '', '','','',''],
  });

  const handleDragStart = (e, name) => e.dataTransfer.setData('text', name);

  const handleDropMainTable = (e, cluster, area, type) => {
    e.preventDefault();
    const name = e.dataTransfer.getData('text');

    // Update the main table data
    setMainTableData((prev) => ({
      ...prev,
      [cluster]: {
        ...prev[cluster],
        [area]: { ...prev[cluster][area], [type]: name },
      },
    }));

    // Remove the name from the list
    setNameTags((prev) => prev.filter((tag) => tag.name !== name));
  };

  const handleDropSecondaryTable = (e, row, colIndex) => {
    e.preventDefault();
    const name = e.dataTransfer.getData('text');

    // Update the secondary table data
    setSecondaryTableData((prev) => ({
      ...prev,
      [row]: prev[row].map((val, idx) => (idx === colIndex ? name : val)),
    }));

    // Remove the name from the list
    setNameTags((prev) => prev.filter((tag) => tag.name !== name));
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
            <th style={headerCellStyle}>OV 1</th>
            <th style={headerCellStyle}>OV 2</th>
            <th style={headerCellStyle}>Unloader</th>
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
  alignItems: 'flex-start', // Align items to the start
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
