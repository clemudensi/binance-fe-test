(async function () {
  const seriesData = await fetchSeriesData()
  let chartData = []
    subscribe(data => { // data: [time, open, high, low, close]
      chartData.push(data)
      // Not showing more than 100 candle-sticks
      chartData.length > 100 ? chartData.splice(0, 1) : chartData
      candleChart(chartData, {
        y:{min:0, max:0,steps:5,label:"price"},
        x:{min:1, max:chartData.length, steps:chartData.length -1,label:"time"}
      })
    })

  // [time, open, high, low, close][]
  function fetchSeriesData() {
    return new Promise((resolve, reject) => {
      fetch('https://www.binance.com/api/v1/klines?symbol=BTCUSDT&interval=1m')
        .then(async res => {
          const data = await res.json()
          const result = data.map(([time, open, high, low, close]) => [time, open, high, low, close])
          resolve(result)
        })
        .catch(e => reject(e))
    })
  }
  function subscribe(success) {
    try {
      const socket = new WebSocket('wss://stream.binance.com/stream?streams=btcusdt@kline_1m')
      socket.onmessage = e => {
        const res = JSON.parse(e.data)
        const { t, o, h, l, c } = res.data.k
        console.log(res.data, 'api data: ')
        success([t, o, h, l, c]);
      }
    } catch(e) {
      console.error(e.message)
    }
  }
})();

function candleChart(data, chartIndex ) {
  let chartInfo= {
    y:{min: chartIndex.y.min, max: chartIndex.y.max,steps: chartIndex.y.steps,label: chartIndex.y.label },
    x:{min: chartIndex.x.min, max: chartIndex.x.max, steps: chartIndex.x.steps,label: chartIndex.x.label }
  };
  const CHART_PADDING = 85;

  const ctx = document.getElementById("kline");
  const draw = ctx.getContext("2d");
  let wid = ctx.width;
  let hei = ctx.height;

  (function initCanvas(){

    draw.font = "8pt Verdana, sans-serif";
    draw.fillStyle = "#999999";
    draw.stroke();
    addStock(data);
  })()

  function drawYAxis(data){
    const maxRow = data.map(index => index[2])
    const minRow = data.map(index => index[3])
    const max = Math.max.apply(null, maxRow);
    const min = Math.min.apply(null, minRow);

    chartInfo.y.max = data[0][2]
    chartInfo.y.min = data[0][3]

    // Update new price low
    if(min < chartInfo.y.min){
      chartInfo.y.min = min;
    } else {
      return chartInfo.y.max
    }

    // Update new price high
    if(max > chartInfo.y.max){
      chartInfo.y.max = max;
    } else {
      return chartInfo.y.max
    }

    draw.moveTo(ctx.width - 80, 0);
    draw.lineTo(ctx.width - 80, chartInfo.y.max );
    draw.strokeStyle = "#999999"
    draw.lineWidth = 1.5;
    draw.stroke();
  }

  function addStock(data){
    let openY;
    let closeYOffset;
    let highY;
    let lowY;
    let currentX;

    draw.clearRect(0, 0, ctx.width, ctx.height);
    drawYAxis(data)
    const elementWidth =(wid - CHART_PADDING * 2)/ data.length;
    const startY = CHART_PADDING;
    const endY = hei-CHART_PADDING;
    const chartHeight = endY-startY;
    const stepSize = chartHeight/(chartInfo.y.max-chartInfo.y.min);

    let currentY;
    const yData = chartInfo.y;
    const steps = chartInfo.y.steps
    const rangeLength = yData.max-yData.min;
    const stepSize1 = rangeLength/steps;

    // Add price point to chart
    for(let i = 0; i < steps; i++){
      currentY = startY + (i/steps) * chartHeight;
      draw.moveTo(wid-CHART_PADDING, currentY );
      draw.lineTo(ctx.width, currentY);
      draw.fillText(`- ${parseInt(yData.min)+stepSize1*(steps-i)}`, ctx.width-80, currentY+4);
    }
    currentY = startY + chartHeight;
    draw.moveTo(CHART_PADDING, currentY );
    draw.lineTo(CHART_PADDING/2,currentY);
    draw.fillText(`- ${parseInt(yData.min)}`, ctx.width-80, currentY-3);

    // draw candlestick
    for(let i = 0; i < data.length; i++){
      openY = (data[i][1]-chartInfo.y.min)*stepSize;
      closeYOffset = (data[i][1] - data[i][4])*stepSize;
      highY = (data[i][2]-chartInfo.y.min)*stepSize;
      lowY =(data[i][3] - chartInfo.y.min)*stepSize;

      //show upward and downward price change
      draw.beginPath();
      currentX = CHART_PADDING + elementWidth*(i+.5);
      draw.moveTo(currentX - 5,endY - highY);
      draw.lineTo(currentX - 5,endY - lowY);
      draw.rect(CHART_PADDING + elementWidth * i ,endY - openY, elementWidth - 10, closeYOffset);

      draw.fillStyle = closeYOffset < 0 ? (function () {
        draw.strokeStyle = "#6fe074";
        return "#6fe074"
      })() : (function () {
        draw.strokeStyle = "#fa5f55";
        return "#fa5f55"
      })() ;
      draw.stroke();
      draw.fillRect(CHART_PADDING + elementWidth * i , endY - openY, elementWidth - 10, closeYOffset);
    }
  }
}