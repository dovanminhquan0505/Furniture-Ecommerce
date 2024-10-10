import React from 'react';
import { LineChart, XAxis, YAxis } from 'recharts';

const Silent = ({ children }) => <>{children}</>;

const SilentXAxis = (props) => (
  <Silent>
    <XAxis {...props} />
  </Silent>
);

const SilentYAxis = (props) => (
  <Silent>
    <YAxis {...props} />
  </Silent>
);

const SilentLineChart = (props) => (
  <Silent>
    <LineChart {...props} />
  </Silent>
);

export { SilentXAxis as XAxis, SilentYAxis as YAxis, SilentLineChart as LineChart };