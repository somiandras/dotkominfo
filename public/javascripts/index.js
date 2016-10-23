(function(window, document) {
  'use strict';

  let refresh = document.getElementById('refresh');
  refresh.addEventListener('click', getData);

  function getData(event) {
    event.target.innerHTML = 'Reload';
    let xhr = new XMLHttpRequest();
    xhr.addEventListener('load', reqListener);
    xhr.open('GET', '/dummydata');
    xhr.send();
  }

  function reqListener() {
    if (this.status === 200) {
      let data = JSON.parse(this.responseText);
      extractData(data);
    } else {
      console.log(this.responseText);
    }
  }

  function extractData(messages) {
    let data = {};
    messages.forEach(message => {
      if (message.symbols) {
        let symbols = message.symbols;
        symbols.forEach(symbol => {
          if (data[symbol.symbol]) {
            data[symbol.symbol].count += 1;
          } else {
            data[symbol.symbol] = {
              count: 1,
              title: symbol.title
            };
          }
        });
      }
    });
    drawPack(arrayify(data));

    let textData = {
      messages: messages.length,
      minDate: d3.min(messages, d => new Date(d.created_at)),
      maxDate: d3.max(messages, d => new Date(d.created_at))
    };
    addTexts(textData);
  }

  function arrayify(data) {
    let list = Object.keys(data);
    let array = list.map(item => {
      return {
        name: item,
        count: data[item].count,
        title: data[item].title
      };
    });
    return array;
  }

  function drawPack(data, textData) {
    // Remove bubbles and caption before creating any new
    d3.select('svg').selectAll('g').remove();
    d3.selectAll('.caption').remove();

    // Create hierarchy from data
    let nodes = {
      children: data
    };
    let root = d3.hierarchy(nodes)
    .sum(d => d.count)
    // .sort((a, b) => b.value - a.value);

    // Create pack layout
    let diameter = 600;
    let pack = d3.pack().size([diameter, diameter]).padding(2);

    // Color scale
    let circleColor = d3.scaleLog()
    .domain([d3.min(nodes.children, d => d.count),
      d3.max(nodes.children, d => d.count)])
    .range(['#9FC3FF', '#2F2BAD'])
    .interpolate(d3.interpolateHsl);

    // Root svg
    let svg = d3.select('svg')
    .attr('width', 900)
    .attr('height', diameter + 100);

    // Data enter
    let node = svg.selectAll('.node')
    .data(pack(root).leaves())
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');

    // Add bubbles
    node.append('circle')
    .style('fill', d => circleColor(d.data.count))
    .transition()
    .duration(600)
    .delay((d, i) => {
      let delay;
      if (d.r > 10) {
        delay = i * 10;
      } else {
        delay = i * 5;
      }
      return delay;
    })
    .ease(d3.easeBackOut)
    .attr('r', d => d.r)
    .call(endAll, attachListeners);

    // Wait for the end of all bubble transitions
    function endAll(transition, callback) {
      if (!callback) callback = function() {};
      if (transition.size === 0) {
        callback();
      }
      let n = 0;
      transition
      .each(() => ++n)
      .on('end', function() {
        if (!--n) {
          callback.apply(this, arguments);
        }
      });
    }

    // Bubble titles
    node
    .append('text')
    .attr('dy', '.3em')
    .style('opacity', 0)
    .style('text-anchor', 'middle')
    .style('font-family', 'arial')
    .style('font-size', d => {
      return Math.floor(d.r / 20) + 10;
    })
    .style('fill', '#ffffff')
    .style('pointer-events', 'none')
    .filter(d => d.r > 20)
    .text(d => d.data.name)
    .transition()
    .duration(1000)
    .delay((d, i) => i * 10)
    .style('opacity', 1);

    // Data exit
    node
    .exit()
    .transition()
    .duration(600)
    .style('opacity', 0)
    .remove();

    // Events
    function attachListeners() {
      node.on('mouseover', function(d) {
        d3.select(this).select('circle')
        .style('stroke-width', 3)
        .style('stroke', 'orange');

        let legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate(560, 30)');

        legend.append('text')
        .style('text-anchor', 'left')
        .style('font-family', 'arial')
        .style('font-size', 12)
        .style('fill', '#888888')
        .text(() => d.data.title);

        let legendText = legend.append('text')
        .attr('y', 22)
        .style('text-anchor', 'left')
        .style('font-family', 'arial')
        .style('fill', '#888888')
        .style('font-size', 12);

        legendText.append('tspan')
          .style('font-weight', 'bold')
          .style('font-size', 20)
          .text(() => d.data.count);

        legendText.append('tspan')
          .text(' mentions');
      });

      node.on('mouseout', function(d) {
        d3.select(this).select('circle')
        .transition()
        .duration(200)
        .style('stroke', 'none');

        svg.select('.legend').remove();
      });
    }
  }

  // Add caption
  function addTexts(textData) {
    let caption = `Cashtag mentions from ${textData.messages} 
    StockTwits trending messages between ${textData.minDate.toLocaleString()} 
    and ${textData.maxDate.toLocaleString()}.`;

    let svg = d3.select('svg');

    svg.append('text').attr('class', 'caption')
    .attr('transform', 'translate(' + 0 + ',' + (svg.attr('height') - 60) + ')')
    .attr('y', 50)
    .style('fill', '#888888')
    .style('opacity', 0)
    .style('font-size', '13')
    .transition()
    .duration(1000)
    .delay(1250)
    .ease(d3.easeCubicOut)
    .attr('y', 0)
    .style('opacity', 1)
    .text(caption);
  }
})(window, document);
