(async function () {
  const seriesData = await fetchSeriesData()
  candleChart(seriesData, {
      y:{min:0, max:0,steps:5,label:"price"},
      x:{min:1, max:24, steps:23,label:"time"}
    })
    console.log('seriesData: ', seriesData)
    subscribe(data => { // data: [time, open, high, low, close]
      console.log('subscribe: ', data)
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
  let stockData;
  const CHART_PADDING = 85;
  let wid;
  let hei


  (function initCanvas(){
    const ctx = document.getElementById("kline");
    wid = ctx.width;
    hei = ctx.height;
    const context = ctx.getContext("2d");
    context.font = "8pt Verdana, sans-serif";
    context.fillStyle = "#999999";
    context.stroke();
    addStock(context, data);
  })()

  function drawYAxis(data){
    const ctx = document.getElementById("kline");
    const draw = ctx.getContext("2d");

    const maxRow = data.map(index => index[2])
    const minRow = data.map(index => index[2])
    const max = Math.max.apply(null, maxRow);
    const min = Math.min.apply(null, minRow);

    chartInfo.y.max = max
    chartInfo.y.min = min

    draw.moveTo(ctx.width - 80, 0);
    draw.lineTo(ctx.width - 80, chartInfo.y.max );
    draw.strokeStyle = "#999999"
    draw.lineWidth = 3;
    draw.stroke();
  }

  function addStock(context, data){
    let openY;
    let closeYOffset;
    let highY;
    let lowY;
    let currentX;

    drawYAxis(data)
    const ctx = document.getElementById("kline");
    const elementWidth =(wid-CHART_PADDING*2)/ data.length;
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
      context.moveTo(wid-CHART_PADDING, currentY );
      context.lineTo(ctx.clientWidth, currentY);
      context.fillText(`-- ${yData.min+stepSize1*(steps-i)}`, ctx.width-80, currentY+4);
    }
    currentY = startY + chartHeight;
    context.moveTo(CHART_PADDING, currentY );
    context.lineTo(CHART_PADDING/2,currentY);
    context.fillText(`-- ${yData.min}`, ctx.width-80, currentY-3);

    for(let i = 0; i < data.length; i++){
      openY = (data[i][1]-chartInfo.y.min)*stepSize;
      closeYOffset = (data[i][1] - data[i][4])*stepSize;
      highY = (data[i][2]-chartInfo.y.min)*stepSize;
      lowY =(data[i][3]-chartInfo.y.min)*stepSize;

      //show upward and downward price change
      context.beginPath();
      currentX = CHART_PADDING +elementWidth*(i+.5);
      context.moveTo(currentX,endY-highY);
      context.lineTo(currentX,endY-lowY);
      context.rect(CHART_PADDING +elementWidth*i ,endY-openY,elementWidth,closeYOffset);

      context.fillStyle = closeYOffset < 0 ? (function () {
        context.strokeStyle = "#6fe074";
        return "#6fe074"
      })() : (function () {
        context.strokeStyle = "#fa5f55";
        return "#fa5f55"
      })() ;
      context.stroke();
      context.fillRect(CHART_PADDING +elementWidth*i ,endY-openY,elementWidth,closeYOffset);
    }
  }
}