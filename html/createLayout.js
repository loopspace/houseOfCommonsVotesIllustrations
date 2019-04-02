var color = d3.scaleOrdinal() // D3 Version 4
    .domain(["Party Membership", "Conservative", "Labour", "Independent","Plaid Cymru","Liberal Democrat","Scottish National Party","Green Party","Democratic Unionist Party","VOTE"])
    .range(["#000000", "#0087dc", "#d50000" , "#808080","#3F8428", "#FDBB30" , "#FFF95D","#008066", "#6ed700" , "#000000"]);

var labels = [
    "Party membership",
    "Conservative",
    "Labour",
    "Independent",
    "Plaid Cymru",
    "Scottish National Party",
    "Green Party",
    "Democratic Unionist Party",
    "Liberal Democrats"
];

// Single creation function to avoid duplication of code 
function createSVG(id,file) {

    var dragging;
    
    var svg = d3.select(id),
	width = +svg.attr("width"),
	height = +svg.attr("height"),
	radius = 30;

    var simulation = d3.forceSimulation()
	.force("link", d3.forceLink().id(function(d) { return d.id; }))
	.force("charge", d3.forceManyBody().distanceMin(10).distanceMax(300).strength(-20))
	.force("center", d3.forceCenter(width / 2, height / 2));

    // Define the div for the tooltip
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // add a legend


    d3.json(file, function(error, graph) {
	if (error) throw error;

	var degrees = {};
	var colours = {};
	var motions = {};
	for (var i = 0; i < graph.nodes.length; i++) {
	    degrees[graph.nodes[i].id] = 0;
	    colours[graph.nodes[i].id] = hex2rgb(color(graph.nodes[i].party));
	    if (graph.nodes[i].group == 9) {
		motions[graph.nodes[i].id] = [0,0,0];
	    }
	}

	for (var i = 0; i < graph.links.length; i++) {
	    degrees[graph.links[i].source] += 1;
	    degrees[graph.links[i].target] += 1;
	    if (motions[graph.links[i].source]) {
		motions[graph.links[i].source][0] += colours[graph.links[i].target][0];
		motions[graph.links[i].source][1] += colours[graph.links[i].target][1];
		motions[graph.links[i].source][2] += colours[graph.links[i].target][2];
	    }
	    if (motions[graph.links[i].target]) {
		motions[graph.links[i].target][0] += colours[graph.links[i].source][0];
		motions[graph.links[i].target][1] += colours[graph.links[i].source][1];
		motions[graph.links[i].target][2] += colours[graph.links[i].source][2];
	    }
	}

	var mx = 0;
	var mn = graph.links.length;
	for (var i = 0; i < graph.nodes.length; i++) {
	    if (graph.nodes[i].group == 9) {
		mx = Math.max(mx, degrees[graph.nodes[i].id]);
		mn = Math.min(mn, degrees[graph.nodes[i].id]);
	    }
	}

	for (var i = 0; i < graph.nodes.length; i++) {
	    if (graph.nodes[i].group == 9) {
		motions[graph.nodes[i].id][0] /= degrees[graph.nodes[i].id];
		motions[graph.nodes[i].id][1] /= degrees[graph.nodes[i].id];
		motions[graph.nodes[i].id][2] /= degrees[graph.nodes[i].id];
	    }
	}

	var link = svg.append("g")
	    .attr("class", "links")
	    .selectAll("line")
	    .data(graph.links)
	    .enter().append("line")
	    .attr("stroke-width", 4);

	var node = svg.append("g")
	    .attr("class", "nodes")
	    .selectAll("circle")
	    .data(graph.nodes)
	    .enter().append("circle")
	    .attr("r", function(d) {
		if (d.group == 9) {return (degrees[d.id] - mn)/(mx - mn)*10 + 10}
		else { return 4}
		;})
	    .attr("fill", function(d) {
		if (d.group == 9) {
		    return 'rgb(' + motions[d.id].join(',') + ')';
		} else {
		    return color(d.party);
		}; })
	    .attr("opacity", function(d) {
		if (d.group == 9) {return .8} else {return 1};
	    })
	    .on("mouseover", function(d) {
		if (!dragging) // for some reason, d3.event.buttons isn't working here
		{
		    div.transition()
			.duration(100)
			.style("opacity", .9);

		    div.html(d.name + " ("  +  d.constituency + ")")
			.style("left", (d3.event.pageX) + "px")
			.style("top", (d3.event.pageY - 28) + "px");
		}
            })
	    .on("mouseout", function(d) {
                div.transition()
                    .duration(1000)
                    .style("opacity", .0);
            })
	    .call(d3.drag()
		  .on("start", dragstarted)
		  .on("drag", dragged)
		  .on("end", dragended))
	;

	simulation
	    .nodes(graph.nodes)
	    .on("tick", ticked);

	simulation.force("link")
	    .links(graph.links);


	function ticked() {


	    link
		.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });

	    node
		.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; });

	    node.attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
		.attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });

	}
    });


    // adding legend texts (there must be an easier way...)
    // There is ... iterate over a list
    var x = 5, y = 10;

    for (var i = 0; i < labels.length; i++ )
    {
	svg.append("g").append("text")
	    .attr("x",x)
	    .attr("y",y)
	    .attr("dy", ".35em")
	    .text(labels[i])
	    .style("fill",color(labels[i]))
	;
	y += 25;
    }
    


//.domain(["Conservative", "Labour", "Independent","Plaid Cymru","Liberal Democrat","Scottish National Party","Green Party","Democratic Unionist Party","VOTE"])
//.range(["#0087dc", "#d50000" , "#808080","#3F8428", "#FDBB30" , "#FFF95D","#008066", "#6ed700" , "#000000"]);


    var dragstarted = function(d) {
	if (!d3.event.active) simulation.alphaTarget(0.3).restart();
	d.fx = d.x;
	d.fy = d.y;
	dragging = true;
    }

    // Stop nodes being dragged outside the SVG
    var dragged = function(d) {
	d.fx = Math.max(radius,Math.min(width - radius,d3.event.x));
	d.fy = Math.max(radius,Math.min(height - radius,d3.event.y));
    }

    var dragended = function(d) {
	if (!d3.event.active) simulation.alphaTarget(0);
	d.fx = null;
	d.fy = null;
	dragging = false;
    }
}

// Create the SVGs
createSVG("#April","voteFileApril.json");
createSVG("#March","voteFile.json");

function hex2rgb(hex) {
    return [
	parseInt(hex.slice(1,3),16),
	parseInt(hex.slice(3,5),16),
	parseInt(hex.slice(5,7),16)
    ];
}
