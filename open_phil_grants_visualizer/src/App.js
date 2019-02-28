import React, { Component } from 'react';
import * as d3 from 'd3-fetch';
import MaterialTable from 'material-table';

import FiltersPanel from './FiltersPanel';
import SpinnerSection from './SpinnerSection';

import './App.css'
// BACKUP COPY FOR OFFLINE DEVELOPMENT USE
import grantsCsv from './grants_db.csv'

class App extends Component {
  constructor() {
    super();
    this.allData = [];
    this.state = {
      data: [],
      filters: {},
    };
  }

  componentDidMount() {
    // PRODUCTION PATH (CORS issue in dev)
    // const grantsDbUrl = 'https://www.openphilanthropy.org/giving/grants/spreadsheet';
    // PROXY PATH FOR DEVLEOPMENT
    // const grantsDbUrl = '/giving/grants/spreadsheet';
    // BACKUP COPY FOR OFFLINE DEVELOPMENT USE
    const grantsDbUrl = grantsCsv;

    d3.csv(grantsDbUrl).then(dirtyData => {
      const data = dirtyData.map((datum => {
        datum['Date'] = this.reformatDate(datum['Date']);
        datum['Amount'] = this.reformatAmount(datum['Amount']);
        return datum;
      }));
      this.allData = data;
      this.setState({ data });
    });
  }

  reformatDate = (dateString) => {
    const dateMatchGroups = dateString.match(/(\d+)\/(\d+)/);
    const year = dateMatchGroups[2];
    const month = dateMatchGroups[1].length === 1 ? `0${dateMatchGroups[1]}` : dateMatchGroups[1];
    return `${year}/${month}`;
  }

  reformatAmount = (amountString) => {
    return Number(amountString.replace(/[^0-9.-]+/g,''));
  }

  grantsTotal = () => {
    if (!this.state.data.length) { return; }
    const subtotal = this.state.data.reduce((accum, current) =>
      accum + Number(current['Amount']), 0);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(subtotal);
  }

  applyFilters = (filterName, filterChoice) => {
    const newFilters = Object.assign({}, this.state.filters);
    newFilters[filterName] = filterChoice;
    this.setState({ filters: newFilters }, this.executeFilters);
  }

  executeFilters = () => {
    const filteredData = this.allData.filter(datum => {
      const chosenYear = this.state.filters['Year'];
      const chosenOrg = this.state.filters['Organization'];
      const chosenArea = this.state.filters['Focus Area'];
      const yearCondition = chosenYear ? chosenYear === this.yearFrom(datum) : true;
      const orgCondition = chosenOrg ? chosenOrg === datum['Organization Name'] : true;
      const areaCondition = chosenArea ? chosenArea === datum['Focus Area'] : true;
      return yearCondition && orgCondition && areaCondition;
    });

    this.setState({ data: filteredData });
  }

  yearFrom = (datum) => {
    return datum["Date"].match(/\d+/)[0];
  }

  render() {
    return (
      <div className='App'>
        <header className='App-header'>
          <div>
            <h3>Grants count: {this.state.data.length}</h3>
            <h3>Grants total: {this.grantsTotal()}</h3>
            <FiltersPanel
              allData={this.allData}
              applyFilters={this.applyFilters}
            />
            {!this.state.data.length && <SpinnerSection />}
            <div>
              {this.state.data.length && <MaterialTable
                title='Grants'
                options={{ search: false, pageSize: 25, pageSizeOptions: [10, 25, 50, 100, this.state.data.length] }}
                columns={[
                  { title: 'Grant Title', field: 'Grant' },
                  { title: 'Organization', field: 'Organization Name' },
                  { title: 'Focus Area', field: 'Focus Area' },
                  { title: 'Date', field: 'Date', type: 'date' },
                  { title: 'Amount', field: 'Amount', type: 'currency' },
                ]}
                data={this.state.data}
              />}
            </div>
          </div>
        </header>
      </div>
    );
  }
}

export default App;
