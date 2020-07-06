import React from 'react';
import PropTypes from 'prop-types';
import { reduxForm } from 'redux-form';
import BasicAuthUserField from '../../Fields/BasicAuthUserField';
import BasicAuthPasswordField from '../../Fields/BasicAuthPasswordField';
import { BASIC_AUTH } from '../../../propTypes';

export const BasicAuthSettingsForm = ({
  handleSubmit, invalid, pristine, reset, submitting, initialValues,
}) => (
  <form className="settings-form" onSubmit={data => handleSubmit(data)}>
    <h3>Basic Authentication Settings</h3>
    <div className="well">
      <fieldset>
        <p className="well-text">
          To enable basic authentication, please submit a username and password credentials required to preview your site builds.
        </p>
        <BasicAuthUserField
          label="username"
          type="text"
          id="basicAuthUsernameInput"
          name="username"
          placeholder="username"
        />
        <BasicAuthPasswordField
          label="password"
          type="password"
          id="basicAuthPasswordInput"
          name="password"
          placeholder="********"
        />
      </fieldset>
      <button type="submit" disabled={invalid || pristine || submitting}>
        Save
      </button>
    </div>
  </form>
);

BasicAuthSettingsForm.propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  invalid: PropTypes.bool.isRequired,
  pristine: PropTypes.bool.isRequired,
  reset: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  onRemove: PropTypes.func.isRequired,
  initialValues: BASIC_AUTH.isRequired,
};

export default reduxForm({
  form: 'basicAuth',
  enableReinitialize: true,
})(BasicAuthSettingsForm);
