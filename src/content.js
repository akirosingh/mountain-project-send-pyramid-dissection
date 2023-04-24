'use strict';

import './content.css';

import renderChart from './sendChart';
import { ROUTE_TYPES } from './constants.js';
import { preprocessData } from './utils/dataUtils';

const ROUTE_TYPE_TO_ELEMENT_ID = {};
ROUTE_TYPE_TO_ELEMENT_ID[ROUTE_TYPES.boulder] = {
  tab: 'boulderTab',
  canvas: 'boulderCanvas',
};
ROUTE_TYPE_TO_ELEMENT_ID[ROUTE_TYPES.sport] = {
  tab: 'sportTab',
  canvas: 'sportCanvas',
};
ROUTE_TYPE_TO_ELEMENT_ID[ROUTE_TYPES.trad] = {
  tab: 'tradTab',
  canvas: 'tradCanvas',
};

const isProfilePage = () => {
  // MP profile page url looks like this:
  // https://www.mountainproject.com/user/<user id>/<user name>
  // We only want to display the climbing chart if we're on a profile page.
  // Do not display on a non-profile page, ex: /contributions, /community, /ticks

  const url = window.location.href;
  const urlSplit = url.split('/');
  return (
    urlSplit.length > 3 &&
    urlSplit.length < 7 &&
    urlSplit[urlSplit.length - 3] == 'user'
  );
};

const getTicksDiv = () => {
  const sections = document.getElementsByClassName('section clearfix');
  if (sections && sections.length == 4) {
    // MP profile pages are split into 4 sections (in this order):
    // To-Do List, Ticks, Tick Breakdown, and Where <User> Climbs.
    // We only care about the Ticks section.
    return sections[1];
  }
  console.warn(
    'Mountain Project - Send Chart extension: Unable to find ticks section!'
  );
};

const renderClimbingChartContainer = () => {
  const container = document.createElement('div');
  container.classList.add('section', 'clearfix');

  // Chart title
  const sendChartTitleContainer = document.createElement('div');
  sendChartTitleContainer.setAttribute('id', 'sendChartTitle');
  sendChartTitleContainer.classList.add('section-title');

  const sendChartTitleHeader = document.createElement('h2');
  sendChartTitleHeader.textContent = 'Send Chart';

  // Loading animation
  const loadingDiv = document.createElement('div');
  loadingDiv.setAttribute('id', 'loading');

  // Chart canvases
  let chartCanvases = [];
  for (let routeType of Object.values(ROUTE_TYPES)) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('id', ROUTE_TYPE_TO_ELEMENT_ID[routeType].canvas);
    canvas.classList.add('chartCanvas');
    chartCanvases.push(canvas);
  }

  if (chartCanvases.length > 0) {
    chartCanvases[0].classList.add('active');
  }

  sendChartTitleContainer.appendChild(sendChartTitleHeader);
  container.appendChild(sendChartTitleContainer);
  container.appendChild(loadingDiv);
  for (let canvas of chartCanvases) {
    container.appendChild(canvas);
  }

  return container;
};

const handleTabClick = (routeType) => {
  const tabs = document.querySelectorAll('.tab');
  for (let tab of tabs) {
    tab.classList.remove('active');
  }
  const canvases = document.querySelectorAll('.chartCanvas');
  for (let canvas of canvases) {
    canvas.classList.remove('active');
  }

  const selectedTab = document.getElementById(
    ROUTE_TYPE_TO_ELEMENT_ID[routeType].tab
  );
  const canvas = document.getElementById(
    ROUTE_TYPE_TO_ELEMENT_ID[routeType].canvas
  );
  selectedTab.classList.add('active');
  canvas.classList.add('active');
};

const renderTabs = () => {
  const tabsContainer = document.createElement('div');
  tabsContainer.classList.add('tabs-container');

  let tabs = [];
  for (let routeType of Object.values(ROUTE_TYPES)) {
    const tab = document.createElement('div');
    tab.setAttribute('id', ROUTE_TYPE_TO_ELEMENT_ID[routeType].tab);
    tab.classList.add('tab');
    tab.textContent = routeType;
    tab.addEventListener('click', () => {
      handleTabClick(routeType);
    });
    tabs.push(tab);
  }

  if (tabs.length > 0) {
    tabs[0].classList.add('active');
  }

  for (let tab of tabs) {
    tabsContainer.appendChild(tab);
  }

  const sendChartTitle = document.getElementById('sendChartTitle');
  sendChartTitle.insertAdjacentElement('afterend', tabsContainer);
};

const displayLoading = (loader) => {
  loader.classList.add('display');
};

const hideLoading = (loader) => {
  loader.remove();
};

if (isProfilePage()) {
  const ticksDiv = getTicksDiv();

  if (ticksDiv) {
    const url = window.location.href;
    const ticksCsvUrl = url.concat('/tick-export');
    const climbingChartContainer = renderClimbingChartContainer();
    ticksDiv.insertAdjacentElement('afterend', climbingChartContainer);

    const loader = document.querySelector('#loading');
    displayLoading(loader);

    fetch(ticksCsvUrl)
      .then((response) => response.text())
      .then((csvData) => {
        hideLoading(loader);
        renderTabs();

        const ticksCollection = preprocessData(csvData);
        for (let routeType of Object.values(ROUTE_TYPES)) {
          renderChart(
            ROUTE_TYPE_TO_ELEMENT_ID[routeType].canvas,
            routeType,
            ticksCollection
          );
        }
      });
  }
}
