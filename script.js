var fileUploaded = false;
var fileName;

function myFunction() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {

    } else {
        alert('The File APIs are not fully supported in this browser.');
        return;
    }

    input = document.getElementById('test');
    if (!input) {
        alert("Um, couldn't find the fileinput element.");
    } else if (!input.files) {
        alert("This browser doesn't seem to support the `files` property of file inputs.");
    } else if (!input.files[0]) {
        alert("Please select a file before clicking 'Load'");
    } else {
        file = input.files[0];
        fileUploaded = true;
        fileName = file.name;
        console.log("file.name: " + file.name);
        console.log("file is called " + fileName);
        main();
        // console.log(num);
        // fr = new FileReader();
        // fr.onload = receivedText;
        // fr.readAsText(file);
    }

    // function receivedText() {
    //     document.getElementById('editor').appendChild(document.createTextNode(fr.result))
    // }
}

main();

function main() {
    console.log("fileUploaded: " + fileUploaded);
    console.log("in Main(): " + fileName);
    // console.log(filename);
    // d3.select("body").remove("svg");
    // d3.select("#theChart").append("svg").attr("width", 1200).attr("height", 400);
    var svg = d3.select("svg"),
        margin = {
            top: 20,
            right: 60,
            bottom: 60,
            left: 40
        },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;
    var g;

    // console.log("g: " + g[0]);

    if (fileUploaded) {
        g.exit().remove();
        // g = svg.append("g")
        //     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    } else {
        g = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    }
    if (fileUploaded) {
        fileRef = fileName;
        console.log("OK");
    } else {
        fileRef = "dataDefault.json";
        // fileRef = "data.json";
    }
    // fileRef = "data.json";
    d3.json(fileRef, function(data) {
        console.log("fileRef: " + fileRef);
        // d3.json("data.json", function(data) {
        // var parseTime = d3.timeParse("%Y-%m-%d %H:%M");
        var parseTime = d3.timeParse("%Y-%m-%d %H:%M");
        var mouseoverTime = d3.timeFormat("%a %e %b %Y %H:%M");
        var minTime = d3.timeFormat("%b%e, %Y");

        data.forEach(function(d) {
                d.mouseoverDisplay = parseTime(d.date);
                d.date = parseTime(d.date);
                d.end = parseTime(d.end);
                d.duration = ((d.end - d.date) / (60 * 1000)); // session duration in minutes
                // console.log("duration: " + d.duration + " minutes");
                d.distance = +d.distance;
                d.intensityInverted = (1 / (d.distance / d.duration)); // inverse of intensity so light colour low intensity and dark colour high intensity
                d.intensity = Math.round(d.distance / d.duration); // actually intensity, metres per minute.
                d.course = d.course.toLowerCase();
                return d;
            },
            function(error, data) {
                if (error) throw error;
            });

        var total = 0;
        data.forEach(function(d) {
            total = d.distance + total;
        });
        var minDate = d3.min(data, function(d) {
            return d.date;
        });

        total = String(total).replace(/(.)(?=(\d{3})+$)/g, '$1,')

        var x = d3.scaleTime()
            .domain(d3.extent(data, function(d) {
                return d.date;
            }))
            .range([0, width]); // max x screen space is width - twice padding

        var y = d3.scaleLinear()
            .domain([0, d3.max(data, function(d) {
                return d.distance
            })])
            .range([height, 0]); // max y screen space is height - twice padding

        var dur = d3.scaleLinear()
            .domain([0, d3.max(data, function(d) {
                return d.duration;
            })])
            .range([0, 12]);

        var colorScale = d3.scaleSequential(d3.interpolateInferno)
            .domain([0, d3.max(data, function(d) {
                return d.intensityInverted;
            })])

        function handleMouseOver(d) {
            d3.select(this)
                .style("fill", "lightBlue")
            g.select('text')
                .attr("x", 15)
                .attr("y", 5)
                // .attr("x", x(d.date) + dur(d.duration + 5))
                // .attr("y", y(d.distance) + 5)
                .text("Session no. " + d.number)
                .append('tspan')
                .text("Date: " + mouseoverTime(d.mouseoverDisplay))
                .attr("x", 15)
                .attr("y", 30)
                .append('tspan')
                .text("Distance: " + d.distance + "m")
                .attr("x", 15)
                .attr("y", 50)
                .append('tspan')
                .text("Duration: " + d.duration + " mins")
                .attr("x", 15)
                .attr("y", 70)
                .append('tspan')
                .text("Intensity: " + d.intensity + " meters/mins")
                .attr("x", 15)
                .attr("y", 90)
                .append('tspan')
                .text("Pool: " + d.pool + "  (" + d.course + ")")
                .attr("x", 15)
                .attr("y", 110);
        }

        function handleMouseOut(d) {
            d3.select(this)
                .style("fill", function(d) {
                    return colorScale(d.intensityInverted);
                });
            g.select('text').text("Total distance since " + minTime(minDate) + ": " + total + "m");
            // console.log("mouseOut " + d.number);
        }

        g.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .style("fill", function(d) {
                return colorScale(d.intensityInverted);
            })
            .attr("class", "bar")
            .attr("x", function(d) {
                return x(d.date);
            })
            .attr("y", function(d) {
                return y(d.distance);
            })
            // .attr("width", x.bandwidth())
            .attr("width", function(d) {
                return dur(d.duration);
            })
            // .attr("width", 6)
            .attr("height", function(d) {
                return height - y(d.distance);
            })
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut);

        g.append('text')
            .attr('x', 15)
            .attr('dy', 5)
            .text("Total distance since " + minTime(minDate) + ": " + total + "m");
        // .attr("class", "shadow");

        g.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + (height + 2) + ")")
            .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%e %b %Y")))
            // .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-35)");

        g.append("g")
            .attr("class", "axis axis--y")
            // .call(d3.axisLeft(y).ticks(10, "%"))
            .call(d3.axisLeft(y).ticks(10))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("text-anchor", "end")
            .text("distance (m)");

    });
}
