import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

window.addEventListener("load", (e) => { main(); })

window.addEventListener('keydown', handleKeyPress);

const startYear = document.getElementById("start-year");
const endYear = document.getElementById("end-year");
let xAxisDropDown = document.getElementById("xaxis-dropdown");
let yAxisDropDown = document.getElementById("yaxis-dropdown");
let hueDropDown = document.getElementById("hue-dropdown");
let xAxisVariable="";
let yAxisVariable="";
let hueVariable = "";

startYear.addEventListener("input", function(event){
    if(event.target.value>endYear.value){
        alert("Can't set \"start year\" value greater than \"end year\"!")
        event.target.value=endYear.value;
    }
    displayRangeValue(event.target);
    document.getElementById("graph-container").innerHTML="";
    chart(csvData, startYear.value, endYear.value);
})

endYear.addEventListener("input", function(event){
    if(event.target.value<startYear.value){
        alert("Can't set \"end year\" value less than \"start year\"!")
        event.target.value=startYear.value;
    }
    displayRangeValue(event.target);
    document.getElementById("graph-container").innerHTML="";
    chart(csvData, startYear.value, endYear.value);
})

xAxisDropDown.addEventListener("change", function(event) {
    xAxisVariable=event.target.value;

    document.getElementById("graph-container").innerHTML="";
    const minMaxYear= getMinMaxYear(csvData);
    chart(csvData, minMaxYear[0], minMaxYear[1]);
});

yAxisDropDown.addEventListener("change", function(event) {
    yAxisVariable=event.target.value;

    document.getElementById("graph-container").innerHTML="";
    const minMaxYear= getMinMaxYear(csvData);
    chart(csvData, minMaxYear[0], minMaxYear[1]);
});

hueDropDown.addEventListener("change", function(event) {
    hueVariable=event.target.value;
    let yAxisDropDownOptions = [...yAxisDropDown.options]
    let hueDropDownOptions = [...hueDropDown.options]
    yAxisDropDownOptions.map(option=>option.value!==xAxisVariable);
    hueDropDownOptions.map(option=>option.value==xAxisVariable);
    
    document.getElementById("graph-container").innerHTML="";
    const minMaxYear= getMinMaxYear(csvData);
    chart(csvData, minMaxYear[0], minMaxYear[1]);
});

const csv = document.getElementById("csvFile")
let csvData = null;
const panSpeed = 10;
const zoomSpeed = 0.1;
let columns = null;

csv.addEventListener("change", async function(event){
    let input = event.target.files[0];
    let csvDataPromise = new Promise(function(resolve){
            const reader=new FileReader();
            reader.onload = function(e){
                const text = e.target.result;
                let data = d3.csvParse(text, d3.autoType);
                resolve(data);
            };
            reader.readAsText(input);
        }).then(function(data){return data});
    csvData = await csvDataPromise;
    setMinMaxRange(csvData);
    displayDropDownMenus(csvData);
    const minMaxYear= getMinMaxYear(csvData);
    let columns = Object.keys(csvData[0]).filter(d=>!isNaN(csvData[0][d]));
    xAxisVariable=columns[1];
    yAxisVariable=columns[2];
    hueVariable=columns[2];
    document.getElementById("graph-container").innerHTML="";
    chart(csvData, minMaxYear[0], minMaxYear[1]);
})

length = (path) => d3.create("svg:path").attr("d", path).node().getTotalLength()

function createDropDownOptions(selectObject, optionValues) {
    selectObject.innerHTML="";
    let emptyOption = document.createElement("option");
    emptyOption.value="";
    emptyOption.text="<Choose>"
    selectObject.appendChild(emptyOption);
    for(let val of optionValues) {
        let option = document.createElement("option");
        option.value = val;
        option.text = val;
        selectObject.appendChild(option);
    }
}

function displayDropDownMenus(csvData) {
    columns = Object.keys(csvData[0]).filter(d=>!isNaN(csvData[0][d]));

    createDropDownOptions(xAxisDropDown, columns);
    createDropDownOptions(yAxisDropDown, columns);
    createDropDownOptions(hueDropDown, columns);
    
    document.getElementById("dropdown-container").style.display="block";
}

function displayRangeValue(element){
    const displayId= element.id+"-value";
    let displayIdElement = document.getElementById(displayId);
    displayIdElement.innerHTML = element.value;
}

function setMinMaxRange(csvData){
    const startYear = document.getElementById("start-year");
    const endYear = document.getElementById("end-year");

    const minMaxYear= getMinMaxYear(csvData);

    startYear.min = endYear.min = minMaxYear[0];
    startYear.max = endYear.max = minMaxYear[1];

    let minYearElements = document.getElementsByClassName("year-min");
    for(let element of minYearElements){
        element.innerHTML = minMaxYear[0];
    }

    let maxYearElements = document.getElementsByClassName("year-max");
    for(let element of maxYearElements){
        element.innerHTML = minMaxYear[1];
    }
    startYear.value=minMaxYear[0];
    endYear.value=minMaxYear[1];
    displayRangeValue(startYear);
    displayRangeValue(endYear);
}

function handleMouseOver(event, data, x, y, tooltip){
    const xPos = x(data[xAxisVariable])
    const yPos = y(data[yAxisVariable])


    tooltip.transition().duration(20).style("opacity", 0.9);
    tooltip.html(`
        <strong>Year:</strong> ${data.year}<br>
        <strong>${xAxisVariable}:</strong> ${data[xAxisVariable]}<br>
        <strong>${yAxisVariable} :</strong> ${data[yAxisVariable]}
    `)
    .style("left", xPos + "px")
    .style("top", yPos + "px");
}

function handleKeyPress(event) {
    const svg = document.getElementById('svgElement')
    if(svg !== null){
        let viewBox = svg.getAttribute('viewBox').split(',').map(Number);
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                pan(panSpeed, 0, viewBox);
                break;
            case 'ArrowRight':
                event.preventDefault();
                pan(-panSpeed, 0, viewBox);
                break;
            case 'ArrowUp':
                event.preventDefault();
                pan(0, panSpeed, viewBox);
                break;
            case 'ArrowDown':
                event.preventDefault();
                pan(0, -panSpeed, viewBox);
                break;
            case '+':
                event.preventDefault();
                zoomIn(viewBox);
                break;
            case '-':
                event.preventDefault();
                zoomOut(viewBox);
                break;
        }
    }
}

function pan(dx, dy, viewBox) {
    viewBox[0] += dx;
    viewBox[1] += dy;
    updateViewBox(viewBox);
}

function zoomIn(viewBox) {
    viewBox[2] /= (1 + zoomSpeed);
    viewBox[3] /= (1 + zoomSpeed);
    updateViewBox(viewBox);
}

function zoomOut(viewBox) {
    viewBox[2] *= (1 + zoomSpeed);
    viewBox[3] *= (1 + zoomSpeed);
    updateViewBox(viewBox);
}

function updateViewBox(viewBox) {
    const svg = document.getElementById('svgElement');
    svg.setAttribute('viewBox', viewBox.join(','));
}

function getMinMaxYear(csvData){
    let minYear=9999;
    let maxYear=0;
    csvData.forEach(element => {
        minYear= (element.year<minYear)? element.year : minYear;
        maxYear= (element.year>maxYear)? element.year : minYear;
    });
    return [minYear, maxYear];
}

function chart(csvData, startYear, endYear)  {
    let graphContainer = document.getElementById("graph-container");
    const minMaxYear = getMinMaxYear(csvData);

    let beforeStartYearData= null;
    let afterEndYearData =null;

    if(startYear!=minMaxYear[0] || endYear!=minMaxYear[1]){
        beforeStartYearData = csvData.filter((element)=>element.year<=startYear);
        afterEndYearData = csvData.filter((element)=>element.year>=endYear);
    }
    
    // Declare the chart dimensions and margins.
    const width = 928;
    const height = 720;
    const marginTop = 20;
    const marginRight = 30;
    const marginBottom = 30;
    const marginLeft = 40;
    const tooltip = d3.select("#graph-container").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);
    const tooltipHtml = document.getElementsByClassName("tooltip");
  
    // Declare the positional encodings.
    const x = d3.scaleLinear()
        .domain(d3.extent(csvData, d => d[xAxisVariable])).nice()
        .range([marginLeft, width - marginRight]);
  
    const y = d3.scaleLinear()
        .domain(d3.extent(csvData, d => d[yAxisVariable])).nice()
        .range([height - marginBottom, marginTop]);
  
    const line = d3.line()
        .curve(d3.curveCatmullRom)
        .x(d => x(d[xAxisVariable]))
        .y(d => y(d[yAxisVariable]));
  
    const svg = d3.create("svg")
        .attr("id", "svgElement")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;");
  
    const l = length(line(csvData));
  
    //x-axis
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x).ticks(width / 80))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("y2", -height)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", width - 4)
            .attr("y", -4)
            .attr("font-weight", "bold")
            .attr("text-anchor", "end")
            .attr("fill", "currentColor")
            .text(`${xAxisVariable}`));
    
    //y-axis
    svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(null, "$.2f"))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
          .attr("x2", width)
          .attr("stroke-opacity", 0.1))
      .call(g => g.select(".tick:last-of-type text").clone()
          .attr("x", 4)
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text(`${yAxisVariable}`));
    

    //curve path
    let highLightColour = "grey";
    let delay=0;
    if(beforeStartYearData != null){
        highLightColour="gold";
        let duration = length(line(beforeStartYearData));
        svg.append("path")
            .datum(beforeStartYearData)
            .attr("fill", "none")
            .attr("stroke", "grey")
            .attr("stroke-width", 2.5)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-dasharray", `0,${duration}`)
            .attr("d", line(beforeStartYearData))
            .transition()
            .duration(duration)
            .ease(d3.easeLinear)
            .attr("stroke-dasharray", `${duration},${duration}`);
        delay+=duration;
    }
    
    let data = csvData.filter(d => d.year >= startYear && d.year <= endYear);
    const dataL = length(line(data));
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", `${highLightColour}`)
        .attr("stroke-width", 2.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-dasharray", `0,${dataL}`)
        .attr("d", line)
      .transition()
        .delay(delay)
        .duration(dataL)
        .ease(d3.easeLinear)
        .attr("stroke-dasharray", `${dataL},${dataL}`);
    delay+=dataL;

    if(afterEndYearData != null){
        let afterL = length(line(afterEndYearData));
        svg.append("path")
            .datum(afterEndYearData)
            .attr("fill", "none")
            .attr("stroke", "grey")
            .attr("stroke-width", 2.5)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-dasharray", `0,${afterL}`)
            .attr("d", line)
            .transition()
            .delay(delay)
            .duration(length(line(afterEndYearData)))
            .ease(d3.easeLinear)
            .attr("stroke-dasharray", `${afterL},${afterL}`);
        delay+=afterL;
    }

    //data circles
    let deltaValues=csvData.map((d, i) => {
        if (i === 0) {
          return 0;
        } else {
          return d[hueVariable] - csvData[i - 1][hueVariable];
        }
    });

    svg.append("g")
        .attr("stroke-width", 2)
      .selectAll("circle")
      .data(csvData)
      .join("circle")
        .attr("cx", (d,i) => x(csvData[i][xAxisVariable]))
        .attr("cy", (d, i) => y(csvData[i][yAxisVariable]))
        .attr("r", 3)
        .attr("fill", (d,i) => getColorScheme(deltaValues)(deltaValues[i]))
        .attr("stroke", (d,i) => getColorScheme(deltaValues)(deltaValues[i]))
        .on("mouseover", function(event, d){handleMouseOver(event, d, x, y, tooltip)})
        .on("mouseout", function () {
            tooltip.transition().duration(300).style("opacity", 0);
        });

    //labels
    const label = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
      .selectAll()
      .data(csvData)
      .join("text")
        .attr("transform", d => `translate(${x(d[xAxisVariable])},${y(d[yAxisVariable])})`)
        .attr("fill-opacity", 0)
        .text(d => d.year)
          .attr("stroke", "white")
          .attr("paint-order", "stroke")
          .attr("fill", "currentColor")
          .each(function(d) {
            const t = d3.select(this);
            switch (d.side) {
              case "top": t.attr("text-anchor", "middle").attr("dy", "-0.7em"); break;
              case "right": t.attr("dx", "0.5em").attr("dy", "0.32em").attr("text-anchor", "start"); break;
              case "bottom": t.attr("text-anchor", "middle").attr("dy", "1.4em"); break;
              case "left": t.attr("dx", "-0.5em").attr("dy", "0.32em").attr("text-anchor", "end"); break;
            }
          });
  
    label.transition()
        .delay((d, i) => length(line(csvData.slice(0, i + 1))) / l * (delay- 125))
        .attr("fill-opacity", 1);

    // legend
    const svgLegendWidth = 500;
    const svgLegendHeight = 40;
    const legendWidth = 400;
    const legendHeight = 20;

    const svgLegend = d3.create("svg")
        .attr("id", "svgLegend")
        .attr("width", svgLegendWidth)
        .attr("height", svgLegendHeight)

    let defs = svgLegend.append("defs")

    let linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient");

    linearGradient
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    svgLegend.append("rect")
          .attr("width", legendWidth)
          .attr("height", legendHeight)
          .style("fill", "url(#linear-gradient");

    linearGradient.selectAll("stop")
        .data( getColorScheme(deltaValues).range() )
        .enter().append("stop")
        .attr("offset", function(d,i) { return i/(getColorScheme(deltaValues).range().length-1); })
        .attr("stop-color", function(d) { return d; });

    let legendTicks = d3.scaleLinear()
                        .domain(d3.extent(deltaValues))
                        .range([0,legendWidth])
    let legendAxis = d3.axisBottom(legendTicks);

    svgLegend.append("g")
          .attr("transform", `translate(0, ${legendHeight})`)
          .call(legendAxis.ticks(legendWidth/25))
          .call(g => g.select(".domain").remove())
          .call(g => g.selectAll(".tick line").clone()
            .attr("y2", -legendHeight)
            .attr("stroke-opacity", 0.1)
            .attr("font-size", 6))
          .call(g => g.append("text")
            .attr("x", legendWidth - 4)
            .attr("y", -4)
            .attr("color", "gold")
            .attr("font-weight", "bold")
            .attr("text-anchor", "end")
            .attr("fill", "currentColor")
            .text(`Delta values of ${hueVariable}`));

    graphContainer.appendChild(svg.node());
    graphContainer.appendChild(svgLegend.node());
}

function getColorScheme(deltaValues) { 
    const colorScaleHue = d3.scaleDiverging(d3.interpolateRdBu)
                            .domain(d3.extent(deltaValues))

    return colorScaleHue;
}

function main(){
    console.log("Hello World!");
}

function openPage(){
    window.open('overview.html', '_blank')
}

window.openPage = openPage;