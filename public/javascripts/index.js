(function(window, document) {
  'use strict';

  let dummy = document.getElementById('dummy');
  dummy.addEventListener('click', () => {
    return getData('dummydata');
  });

  let data = document.getElementById('data');
  data.addEventListener('click', () => {
    return getData('data');
  });

  function drawRandomChart() {
    let randomData = createRandomData();
    console.log(randomData);
    drawPack(randomData);
  }

  function createRandomData() {
    let companies = [];
    let numberOfCompanies = Math.floor(Math.random() * (300 - 50) + 50);

    for (let i = 0; i < numberOfCompanies; i++) {
      let company = createCompany();
      let count = Math.round(Math.random() * (1000 - 1) + 1);
      company.count = count;
      companies.push(company);
    }

    return companies;
  }

  function createCompany() {
    let ticker = '';
    for (let j = 0; j < 3; j++) {
      let charcode = Math.random() * (90 - 65) + 65;
      ticker = ticker.concat(String.fromCharCode(charcode));
    }
    let title = ticker + ' Corp.';
    return {
      symbol: ticker,
      title: title
    };
  }

  function getData(mode) {
    mode = mode || 'dummydata';
    let url = '/' + mode;
    console.log('Getting data in ' + mode + ' mode');
    let xhr = new XMLHttpRequest();
    xhr.addEventListener('load', reqListener);
    xhr.open('GET', url);
    xhr.send();
  }

  function reqListener() {
    if (this.status === 200) {
      let data = JSON.parse(this.responseText);
      extractData(data);
      console.log('Min: ' + d3.min(data, d => new Date(d.created_at)));
      console.log('Max: ' + d3.max(data, d => new Date(d.created_at)));
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

  function drawPack(data) {
    d3.select('svg').selectAll('g').remove();

    let diameter = 600;
    let nodes = {
      children: data
    };

    let root = d3.hierarchy(nodes)
    .sum(d => d.count)
    .sort((a, b) => b.value - a.value);

    let pack = d3.pack().size([diameter, diameter]).padding(2);
    let circleColor = d3.scaleLinear()
    .domain([d3.min(nodes.children, d => d.count), d3.max(nodes.children, d => d.count)])
    .range(['#1F3570', '#8117DE'])
    .interpolate(d3.interpolateHcl);

    // Root svg
    let svg = d3.select('svg')
    .attr('width', 900)
    .attr('height', diameter);

    // Data enter
    let node = svg.selectAll('.node')
    .data(pack(root).leaves())
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');

    // Bubbles
    node.append('circle')
    .attr('r', d => d.r)
    .style('fill', 'white')
    .transition()
    .duration(600)
    .delay((d, i) => {
      let delay;
      if (d.r > 10) {
        delay = i * 20;
      } else {
        delay = i * 10;
      }
      return delay;
    })
    .style('fill', d => circleColor(d.data.count))
    .call(endAll, attachListeners);

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
    .style('font-size', 11)
    .style('fill', '#ffffff')
    .style('pointer-events', 'none')
    .filter(d => d.r > 20)
    .text(d => d.data.name)
    .transition()
    .duration(1000)
    .delay((d, i) => i * 30)
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
})(window, document);