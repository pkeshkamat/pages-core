/* eslint-disable react/forbid-prop-types */

import React from 'react';
import { Link, useParams } from 'react-router-dom';

import { useBuildLogs } from '../../hooks';
import SiteBuildLogTable from './siteBuildLogTable';
import DownloadBuildLogsButton from './downloadBuildLogsButton';
import CommitSummary from './CommitSummary';

export const REFRESH_INTERVAL = 15 * 1000;

const SiteBuildLogs = () => {
  const { buildId: buildIdStr } = useParams();
  const buildId = parseInt(buildIdStr, 10);
  const { logs, state } = useBuildLogs(buildId);

  return (
    <div>
      <CommitSummary buildId={buildId} />
      <div className="log-tools">
        <ul className="usa-unstyled-list">
          {(process.env.FEATURE_BUILD_TASKS === 'active') && (
          <li><Link className="usa-button usa-button-secondary" to="./../scans">View scan results</Link></li>
          )}
          <li><DownloadBuildLogsButton buildId={buildId} buildLogsData={logs} /></li>
        </ul>
      </div>
      {(!logs || logs?.length === 0) && (
      <div>
        <SiteBuildLogTable buildLogs={['This build does not have any build logs.']} />
      </div>
      )}
      {(logs && logs?.length > 0) && (
      <SiteBuildLogTable buildLogs={logs} buildState={state} />
      )}
    </div>
  );
};

export default React.memo(SiteBuildLogs);
