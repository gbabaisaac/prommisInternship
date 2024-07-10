import React from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import ZValueSelector from './ZValueSelector';
import ResizableHeatmap from './DraggableResizableImage';
import { Grid, Button, TextField, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import csvData from './ExpData.csv';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './App.css'; // Add your custom CSS if needed

// WidthProvider is a higher-order component that automatically provides width to the Responsive component
const ResponsiveReactGridLayout = WidthProvider(Responsive);

class Heatmap extends React.Component {
  constructor(props) {
    super(props);

    // Initialize the state
    this.state = {
      data: { x: [], y: [], z: {} }, // Holds the x, y, and z values for the heatmaps
      x: [], // Unique x values extracted from CSV
      y: [], // Unique y values extracted from CSV
      selectedZ: [], // Currently selected Z values
      savedLayouts: [], // Array to store saved layouts
      zOptions: [], // Options for the Z value selector
      layoutName: '', // Name of the layout to be saved
      selectedLayout: '', // Name of the currently selected layout
      layouts: { lg: [] }, // Layouts object for the grid layout
      mounted: false, // Flag to check if the component is mounted
    };

    // Binding methods to the component instance
    this.onBreakpointChange = this.onBreakpointChange.bind(this);
    this.onLayoutChange = this.onLayoutChange.bind(this);
    this.onZChange = this.onZChange.bind(this);
    this.onSaveLayout = this.onSaveLayout.bind(this);
    this.onLayoutSelect = this.onLayoutSelect.bind(this);
    this.onDeleteLayout = this.onDeleteLayout.bind(this);
  }

  componentDidMount() {
    // Load the data once the component is mounted
    this.loadData();
    // Set the mounted flag to true
    this.setState({ mounted: true });
  }

  // Function to parse the CSV data
  parseCSV(csvData) {
    const rows = csvData.split('\n').map(row => row.split(','));
    const headers = rows[0];
    const dataRows = rows.slice(1).filter(row => row.length === headers.length);
    return { headers, rows: dataRows };
  }

  // Function to update the heatmap with the selected Z keys
  updateHeatmap(zKeys, loadedData) {
    const newZ = zKeys.reduce((acc, zKey) => {
      if (loadedData.z[zKey]) {
        acc[zKey] = loadedData.z[zKey];
      }
      return acc;
    }, {});
    return newZ;
  }

  // Function to load data from the CSV file
  loadData() {
    fetch(csvData)
      .then(response => response.text())
      .then(csv => {
        const { headers, rows } = this.parseCSV(csv);
        const desalIndex = headers.indexOf('Desal 1 base cost');
        const disposalIndex = headers.indexOf('Disposal cost');

        const xValues = new Set();
        const yValues = new Set();
        const zData = {};
        headers.slice(2).forEach(header => {
          zData[header] = [];
        });

        rows.forEach(row => {
          const xValue = parseFloat(row[desalIndex]);
          const yValue = parseFloat(row[disposalIndex]);

          xValues.add(xValue);
          if (yValue >= 1 && yValue <= 5) {
            yValues.add(yValue);
            headers.slice(2).forEach((header, index) => {
              if (!zData[header]) zData[header] = [];
              zData[header].push({ x: xValue, y: yValue, value: parseFloat(row[index + 2]) });
            });
          }
        });

        const uniqueX = Array.from(xValues);
        const uniqueY = Array.from(yValues);

        Object.keys(zData).forEach(header => {
          const zMatrix = Array.from({ length: uniqueY.length }, () => Array(uniqueX.length).fill(null));
          zData[header].forEach(point => {
            const xIndex = uniqueX.indexOf(point.x);
            const yIndex = uniqueY.indexOf(point.y);
            if (xIndex !== -1 && yIndex !== -1) {
              zMatrix[yIndex][xIndex] = point.value;
            }
          });
          zData[header] = zMatrix;
        });

        // Update the state with the loaded data
        this.setState({
          data: { x: uniqueX, y: uniqueY, z: zData },
          x: uniqueX,
          y: uniqueY,
          zOptions: headers.slice(2),
        });
      });
  }

  // Function to handle breakpoint changes
  onBreakpointChange(breakpoint) {
    this.setState({ currentBreakpoint: breakpoint });
  }

  // Function to handle layout changes
  onLayoutChange(layout, layouts) {
    this.setState({ layouts });
  }

  // Function to handle changes in the selected Z values
  onZChange(event, value) {
    this.setState({ selectedZ: value });
  }

  // Function to save the current layout
  onSaveLayout() {
    const { layoutName, layouts } = this.state;
    if (layoutName.trim() !== '') {
      this.setState(prevState => ({
        savedLayouts: [...prevState.savedLayouts, { name: layoutName, layout: layouts.lg }],
        layoutName: '',
      }));
    }
  }

  // Function to select a saved layout
  onLayoutSelect(event) {
    const selected = event.target.value;
    const layout = this.state.savedLayouts.find(layout => layout.name === selected);
    if (layout) {
      this.setState({ selectedLayout: selected, layouts: { lg: layout.layout } });
    }
  }

  // Function to delete a saved layout
  onDeleteLayout(name) {
    this.setState(prevState => ({
      savedLayouts: prevState.savedLayouts.filter(layout => layout.name !== name),
      ...(prevState.selectedLayout === name ? { selectedLayout: '', layouts: { lg: [] } } : {}),
    }));
  }

  render() {
    const { data, x, y, selectedZ, zOptions, layoutName, selectedLayout, layouts, mounted } = this.state;
    const filteredData = { ...data, z: this.updateHeatmap(selectedZ, data) };

    return (
      <div>
        <Grid container spacing={2} alignItems="center" justifyContent="flex-start">
          <Grid item>
            <ZValueSelector zOptions={zOptions} selectedZ={selectedZ} handleChange={this.onZChange} multiple />
          </Grid>
          <Grid item>
            <TextField
              label="Layout Name"
              value={layoutName}
              onChange={(e) => this.setState({ layoutName: e.target.value })}
              variant="outlined"
              style={{ margin: '16px', minWidth: '200px' }}
            />
          </Grid>
          <Grid item>
            <Button variant="contained" color="primary" onClick={this.onSaveLayout} style={{ margin: '16px' }}>
              Save Layout
            </Button>
          </Grid>
          <Grid item>
            <FormControl variant="outlined" style={{ margin: '16px', minWidth: '200px' }}>
              <InputLabel id="saved-layout-select-label">Saved Layouts</InputLabel>
              <Select
                labelId="saved-layout-select-label"
                value={selectedLayout}
                onChange={this.onLayoutSelect}
                label="Saved Layouts"
              >
                {this.state.savedLayouts.map((layout, index) => (
                  <MenuItem key={index} value={layout.name}>
                    {layout.name}
                    <IconButton onClick={() => this.onDeleteLayout(layout.name)} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <ResponsiveReactGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={30}
          onBreakpointChange={this.onBreakpointChange}
          onLayoutChange={this.onLayoutChange}
          measureBeforeMount={false}
          useCSSTransforms={mounted}
          compactType="vertical"
        >
          {selectedZ.map((zKey, index) => (
            <div key={zKey} data-grid={{ x: index * 4 % 12, y: Infinity, w: 4, h: 4 }}>
              <div className="handle" style={{ width: '100%', height: '100%' }}>
                <ResizableHeatmap
                  data={[
                    {
                      x: x,
                      y: y,
                      z: filteredData.z[zKey],
                      type: 'heatmap',
                      colorscale: 'Viridis',
                      colorbar: {
                        title: zKey,
                        titleside: 'right',
                      },
                    },
                  ]}
                  layout={{
                    title: `Heatmap of ${zKey}`,
                    xaxis: { title: 'Desal 1 base cost' },
                    yaxis: { title: 'Disposal cost' },
                    autosize: true,
                    margin: { t: 50, b: 50, l: 50, r: 50 },
                  }}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          ))}
        </ResponsiveReactGridLayout>
      </div>
    );
  }
}

export default Heatmap;
