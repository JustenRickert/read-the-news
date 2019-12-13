import React, { useRef, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Chart from "chart.js";
import { parseSite, zip } from "shared/utils";

import { bucketEntries, bucket, mapValues, flatten } from "./utils";

const toRgb = (color, alpha = 1) => {
  let r;
  let g;
  let b;
  switch (color) {
    case "yellow":
      r = 255;
      g = 255;
      break;
    case "red":
      r = 255;
      break;
    case "green":
      g = 255;
      break;
    case "blue":
      b = 255;
      break;
    case "orange":
      r = 255;
      g = 128;
      break;
    default:
      throw new Error();
  }
  return `rgb(${r || 0}, ${g || 0}, ${b || 0}, ${alpha})`;
};

const COLORS = ["red", "green", "blue", "yellow", "orange"].map(color => ({
  borderColor: toRgb(color),
  backgroundColor: toRgb(color, 0.2)
}));

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
      ...COLORS[i],
      metricLowerbound,
      metricUpperbound,
      sentimentAverages,
      articles,
      sentiments: articles.map(article => sentimentRecord[article.href]),
      data: [...sentimentAveragesNormalized, articles.length]
    };
  });
};

const radarOptions = {
  animation: {
    duration: 0
  },
  tooltips: {
    callbacks: {
      title: function(items, data) {
        const sites = items.map(item => data.datasets[item.datasetIndex].label);
        return `${sites.join(", ")} (${data.labels[items[0].index]})`;
      },
      label: function(item, data) {
        const point = data.datasets[item.datasetIndex];
        if (data.labels[item.index] === "count") return point.data[item.index];
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
  const radar = useRef(null);
  const chart = useRef(null);
  const siteRecord = useSelector(state => state.sites);
  const articleSiteRecord = useSelector(state => state.articles);
  useEffect(() => {
    if (!chart.current && radar.current) {
      const datasets = makeDatasets(sentimentRecord, dashboard);
      chart.current = new Chart(radar.current, {
        type: "radar",
        data: {
          labels: [...METRICS, "count"],
          datasets
        },
        radarOptions
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
  return <canvas ref={radar} id="radar" />;
};

const makeTimelineDatasets = (dashboard, sentimentRecord) => {
  const siteArticlesRecord = bucket(dashboard, article =>
    parseSite(article.href)
  );
  return Object.entries(
    mapValues(siteArticlesRecord, articles =>
      articles.map(article => ({
        article,
        sentiment: sentimentRecord[article.href]
      }))
    )
  ).map(([site, articleData], i) => ({
    label: site,
    ...COLORS[i],
    pointRadius: 10,
    articleData,
    data: articleData.map(({ article, sentiment }) => ({
      x: new Date(article.publicationDate),
      y: sentiment.score
    }))
  }));
};

const timelineOptions = {
  scales: {
    xAxes: [
      {
        type: "time",
        time: {
          unit: "day"
        }
      }
    ]
  },
  animation: {
    duration: 0
  },
  tooltips: {
    callbacks: {
      title: (items, data) => {
        const datasets = items.map(item => data.datasets[item.datasetIndex]);
        return datasets.map(ds => ds.label).join(" ");
      },
      label: (item, data) => {
        const datapoint = data.datasets[item.datasetIndex].data[item.index];
        const score = datapoint.y;
        return [
          `${score} ${score === 1 ? "point" : "points"},`,
          new Date(datapoint.x).toDateString()
        ].join(" ");
      },
      afterLabel: (item, data) => {
        const datapoint =
          data.datasets[item.datasetIndex].articleData[item.index];
        return datapoint.article.title;
      }
    }
  }
};

export const Timeline = ({ dashboard, sentimentRecord }) => {
  const timeline = useRef(null);
  const chart = useRef(null);
  useEffect(() => {
    if (!chart.current && timeline.current) {
      chart.current = Chart.Scatter(timeline.current, {
        options: timelineOptions,
        data: {
          datasets: makeTimelineDatasets(dashboard, sentimentRecord)
        }
      });
      chart.current.update();
    }
    if (
      chart.current &&
      flatten(Object.values(dashboard)).every(
        article => sentimentRecord[article.href]
      )
    ) {
      chart.current.data.datasets = makeTimelineDatasets(
        dashboard,
        sentimentRecord
      );
      chart.current.update();
    }
  }, [dashboard, sentimentRecord]);
  return <canvas ref={timeline} id="timeline" />;
};
