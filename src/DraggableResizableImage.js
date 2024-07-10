import React from 'react';
import Plot from 'react-plotly.js';

const DraggableResizableImage = ({ data, layout }) => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Plot
        data={data}
        layout={layout}
        config={{ displayModeBar: false }}  // Disable Plotly controls
        useResizeHandler={true}  // Enable Plotly's resize handler
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default DraggableResizableImage;
