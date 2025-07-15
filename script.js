const chartCtx = document.getElementById("branchChart").getContext("2d");
let roommateData = [];
let branchChart;

function titleCase(name) {
  return name
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}


function getBranch(admNo) {
  const match = admNo.match(/^[UI]24([A-Z]{2})\d{2,3}$/);
  return match ? match[1] : "UNKNOWN";
}


function getFloor(room) {
  const match = room.match(/^[ABC](\d)/);
  return match ? parseInt(match[1]) : null;
}

function getWing(room) {
  const match = room.match(/^([ABC])/);
  return match ? match[1] : null;
}


let floorCharts = {};

function renderTableAndGraphs(selectedBranch) {
  console.log("Rendering everything for:", selectedBranch);
  renderTable(selectedBranch);
  renderFloorCharts(selectedBranch);
  renderRoomExchangeTable(selectedBranch);
}


function renderTable(selectedBranch) {
  const tbody = document.getElementById("roomTableBody");
  tbody.innerHTML = "";

  roommateData.forEach(entry => {
    entry.roommates.forEach(rm => {
      const branch = getBranch(rm.admission_no);
      if (!selectedBranch || branch === selectedBranch) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="p-2 border-b border-gray-700">${entry.room}</td>
          <td class="p-2 border-b border-gray-700">${rm.name}</td>
          <td class="p-2 border-b border-gray-700">${rm.admission_no}</td>
        `;
        tbody.appendChild(tr);
      }
    });
  });
}


function renderFloorCharts(selectedBranch) {
  const wingFloorMap = {
    A: Array(8).fill(0),
    B: Array(8).fill(0),
    C: Array(8).fill(0)
  };

  roommateData.forEach(entry => {
    const wing = getWing(entry.room);
    const floor = getFloor(entry.room);
    if (!wing || floor === null) return;

    entry.roommates.forEach(rm => {
      if (getBranch(rm.admission_no) === selectedBranch) {
        if (floor >= 1 && floor <= 8) {
          wingFloorMap[wing][floor - 1]++;
        }
      }
    });
  });

  ['A', 'B', 'C'].forEach(wing => {
    const canvasId = `${wing}WingChart`;
    const ctx = document.getElementById(canvasId).getContext("2d");

    if (floorCharts[wing]) {
      floorCharts[wing].destroy();
    }

    floorCharts[wing] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Array.from({ length: 8 }, (_, i) => `Floor ${i + 1}`),
        datasets: [{
          label: `${wing} Wing`,
          data: wingFloorMap[wing],
          backgroundColor: 'rgba(59,130,246,0.7)'
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  });
}


function renderRoomExchangeTable(selectedBranch) {
  const tbody = document.getElementById("exchangeTableBody");
  tbody.innerHTML = "";

  roommateData.forEach(entry => {
    const selectedRoommates = entry.roommates.filter(rm => getBranch(rm.admission_no) === selectedBranch);
    if (selectedRoommates.length > 0 && entry.roommates.length > 1) {
      entry.roommates.forEach(rm => {
        const branch = getBranch(rm.admission_no);
        if (branch !== selectedBranch) {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td class="p-2 border-b border-gray-700">${entry.room}</td>
            <td class="p-2 border-b border-gray-700">${rm.name}</td>
            <td class="p-2 border-b border-gray-700">${rm.admission_no}</td>
            <td class="p-2 border-b border-gray-700">${branch}</td>
          `;
          tbody.appendChild(tr);
        }
      });
    }
  });
}


var mysite = "aayush-droid-8cb432.netlify.app";
var api = "roommates.json";
fetch(`https://${mysite}/${api}`)
  .then(res => res.json())
  .then(data => {
    roommateData = data;
    const branches = new Set();
    const branchCount = {};

    data.forEach(entry => {
      entry.roommates.forEach(rm => {
        const branch = getBranch(rm.admission_no);
        branches.add(branch);
        branchCount[branch] = (branchCount[branch] || 0) + 1;
      });
    });

    
    const dropdown = document.getElementById("branchSelect");
    Array.from(branches).sort().forEach(branch => {
      const opt = document.createElement("option");
      opt.value = branch;
      opt.textContent = branch;
      dropdown.appendChild(opt);
    });

    
    branchChart = new Chart(chartCtx, {
      type: "bar",
      data: {
        labels: Object.keys(branchCount),
        datasets: [{
          label: "Number of Students",
          data: Object.values(branchCount),
          backgroundColor: "rgba(72, 187, 120, 0.7)"
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

    
    dropdown.addEventListener("change", () => {
      console.log("Dropdown selected:", dropdown.value);
      renderTableAndGraphs(dropdown.value);
    });

    renderTableAndGraphs(""); 
  });
