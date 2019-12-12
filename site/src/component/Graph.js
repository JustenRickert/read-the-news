import React, { useRef, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Chart from "chart.js";
import { parseSite, zip } from "shared/utils";

import { bucketEntries, bucket } from "./utils";

const COLORS = ["yellow", "red", "green", "blue"];

const METRICS = ["score", "comparative", "length"];

const normalize = (lowerbound, upperbound, n) =>
  (n - lowerbound) / (upperbound - lowerbound);

const makeDatasets = (sentimentRecord, dashboard) => {
  const siteDashboards = bucket(dashboard, article => parseSite(article.href));
  const allArticles = Object.values(dashboard);
  const metricLowerbound = METRICS.map(key =>
    Math.min(...allArticles.map(article => sentimentRecord[article.href][key]))
  );
  const metricUpperbound = METRICS.map(key =>
    Math.max(...allArticles.map(article => sentimentRecord[article.href][key]))
  );
  return Object.entries(siteDashboards).map(([site, articles], i) => {
    const sentimentAverages = METRICS.map((key, j) =>
      articles.reduce(
        (sum, article) => sum + sentimentRecord[article.href][key],
        0
      )
    );
    const sentimentAveragesNormalized = METRICS.map((key, j) =>
      articles.reduce(
        (sum, article) =>
          sum +
          normalize(
            metricLowerbound[j],
            metricUpperbound[j],
            sentimentRecord[article.href][key]
          ),
        0
      )
    );
    return {
      label: site,
      backgroundColor: COLORS[i],
      metricLowerbound,
      metricUpperbound,
      sentimentAverages,
      articles,
      sentiments: articles.map(article => sentimentRecord[article.href]),
      data: sentimentAveragesNormalized
    };
  });
};

const options = {
  tooltips: {
    callbacks: {
      title: function(items, data) {
        const site = data.datasets[items[0].datasetIndex].label;
        return `${site} (${data.labels[items[0].index]})`;
      },
      label: function(item, data) {
        const point = data.datasets[item.datasetIndex];
        const percent = data.datasets[item.datasetIndex].data[item.index];
        return `${point.sentimentAverages[item.index].toFixed(2)} (${(
          100 * percent
        ).toFixed(2)}%)`;
      },
      afterBody: function(items, data) {
        const { articles, sentiments } = data.datasets[items[0].datasetIndex];
        return zip(articles, sentiments).map(
          ([article, sentiment]) => `(${sentiment.score}) ${article.title}`
        );
      }
    }
  }
};

export const Radar = ({ dashboard, sentimentRecord }) => {
  const chart = useRef(null);
  const siteRecord = useSelector(state => state.sites);
  const articleSiteRecord = useSelector(state => state.articles);
  useEffect(() => {
    const context = document.getElementById("radar");
    if (!chart.current) {
      const datasets = makeDatasets(sentimentRecord, dashboard);
      chart.current = new Chart(context, {
        type: "radar",
        data: {
          labels: METRICS,
          datasets
        },
        options
      });
      return;
    }
    if (
      chart &&
      dashboard &&
      Object.keys(dashboard).every(href => sentimentRecord[href])
    ) {
      const siteDashboards = bucket(dashboard, article =>
        parseSite(article.href)
      );
      const datasets = makeDatasets(sentimentRecord, dashboard);
      chart.current.data.datasets = datasets;
      chart.current.update();
    }
  }, [articleSiteRecord, dashboard, sentimentRecord]);
  return (
    <div>
      <canvas id="radar" />
    </div>
  );
};
