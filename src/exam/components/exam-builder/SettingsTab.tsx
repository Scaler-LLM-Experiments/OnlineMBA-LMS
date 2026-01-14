import React from 'react';
import { ExamSettings } from '../../services/examApi';

interface SettingsTabProps {
  settings: ExamSettings;
  onSettingsChange: (settings: ExamSettings) => void;
}

export default function SettingsTab({ settings, onSettingsChange }: SettingsTabProps) {
  // Ensure proctoring object exists with defaults
  const proctoring = settings.proctoring || {
    webcamRequired: true,
    enforceScreensharing: true,
    allowWindowSwitching: false,
    alertsOnViolation: true,
    beepAlerts: false,
    allowTextSelection: false,
    allowCopyPaste: false,
    allowRightClick: false,
    allowRestrictedEvents: false,
    allowTabSwitching: false,
    exitCloseWarnings: true,
    fullscreenMandatory: true,
    singleSessionLogin: true,
    logoutOnViolation: false,
    disqualifyOnViolation: true,
    maxViolationsBeforeAction: 5,
    allowedIPs: [],
    ipRestrictionEnabled: false
  };

  const updateSetting = (key: keyof ExamSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const updateProctoringSetting = (key: string, value: any) => {
    onSettingsChange({
      ...settings,
      proctoring: { ...proctoring, [key]: value }
    });
  };

  return (
    <div className="space-y-8">
      {/* Exam Behavior Settings */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Exam Behavior</h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-900/50">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Randomize Questions</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Show questions in random order for each student</p>
            </div>
            <input
              type="checkbox"
              checked={settings.randomizeQuestions}
              onChange={(e) => updateSetting('randomizeQuestions', e.target.checked)}
              className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-900/50">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Randomize Options</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Shuffle MCQ options for each student</p>
            </div>
            <input
              type="checkbox"
              checked={settings.randomizeOptions}
              onChange={(e) => updateSetting('randomizeOptions', e.target.checked)}
              className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-900/50">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Enable Rough Space</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Provide rough space for calculations</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableRoughSpace}
              onChange={(e) => updateSetting('enableRoughSpace', e.target.checked)}
              className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-900/50">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Enable Negative Marking</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Deduct marks for wrong answers</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableNegativeMarking}
              onChange={(e) => updateSetting('enableNegativeMarking', e.target.checked)}
              className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
          </label>

          {settings.enableNegativeMarking && (
            <div className="ml-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 space-y-4">
              {/* Negative Marking Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Negative Marking Type
                </label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    settings.negativeMarkingType === 'exam'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="negativeMarkingType"
                      checked={settings.negativeMarkingType === 'exam'}
                      onChange={() => updateSetting('negativeMarkingType', 'exam')}
                      className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Exam-based</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Same negative marks for all questions</p>
                    </div>
                  </label>
                  <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    settings.negativeMarkingType === 'question'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="negativeMarkingType"
                      checked={settings.negativeMarkingType === 'question'}
                      onChange={() => updateSetting('negativeMarkingType', 'question')}
                      className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Question-based</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Set negative marks per question</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Exam-based Negative Marks Value */}
              {settings.negativeMarkingType === 'exam' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Negative Marks Value (for all questions)
                  </label>
                  <input
                    type="number"
                    value={settings.negativeMarksValue}
                    onChange={(e) => updateSetting('negativeMarksValue', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                    min="0"
                    step="0.25"
                    placeholder="0"
                  />
                </div>
              )}

              {settings.negativeMarkingType === 'question' && (
                <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <span>ℹ️</span> Set negative marks individually for each question in the Questions tab
                </p>
              )}
            </div>
          )}

          <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-900/50">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Show Results Immediately</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Display results right after exam submission</p>
            </div>
            <input
              type="checkbox"
              checked={settings.showResultsImmediately}
              onChange={(e) => updateSetting('showResultsImmediately', e.target.checked)}
              className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-900/50">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Show Correct Answers</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Display correct answers after submission</p>
            </div>
            <input
              type="checkbox"
              checked={settings.showCorrectAnswers}
              onChange={(e) => updateSetting('showCorrectAnswers', e.target.checked)}
              className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-900/50">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Auto Submit on Time Up</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Automatically submit when timer expires</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSubmitOnTimeUp}
              onChange={(e) => updateSetting('autoSubmitOnTimeUp', e.target.checked)}
              className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
          </label>

          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Grace Period (seconds)
            </label>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Extra time allowed after the timer expires before auto-submit
            </p>
            <input
              type="number"
              value={settings.gracePeriod}
              onChange={(e) => updateSetting('gracePeriod', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              min="0"
              max="300"
            />
          </div>
        </div>
      </section>

      {/* Proctoring Settings */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Proctoring Settings</h3>
        <div className="space-y-6">
          {/* Camera & Screen Sharing */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Camera & Screen Sharing</h4>
            <div className="space-y-3">
              <label className="flex items-start justify-between cursor-pointer">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Webcam Required</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Turn On Webcam For this test?</p>
                </div>
                <input
                  type="checkbox"
                  checked={proctoring.webcamRequired}
                  onChange={(e) => updateProctoringSetting('webcamRequired', e.target.checked)}
                  className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>
              <label className="flex items-start justify-between cursor-pointer">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Enforce Screen Sharing</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Turn On Screen Sharing For this test?</p>
                </div>
                <input
                  type="checkbox"
                  checked={proctoring.enforceScreensharing}
                  onChange={(e) => updateProctoringSetting('enforceScreensharing', e.target.checked)}
                  className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>
            </div>
          </div>

          {/* Window & Tab Controls */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Window & Tab Controls</h4>
            <div className="space-y-3">
              <label className="flex items-start justify-between cursor-pointer">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Allow Window Switching</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Allow switching to other windows during live session?</p>
                </div>
                <input
                  type="checkbox"
                  checked={proctoring.allowWindowSwitching}
                  onChange={(e) => updateProctoringSetting('allowWindowSwitching', e.target.checked)}
                  className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>
              <label className="flex items-start justify-between cursor-pointer">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Allow Tab Switching</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Allow tab switches by candidate during live session?</p>
                </div>
                <input
                  type="checkbox"
                  checked={proctoring.allowTabSwitching}
                  onChange={(e) => updateProctoringSetting('allowTabSwitching', e.target.checked)}
                  className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>
            </div>
          </div>

          {/* Interaction Controls */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Interaction Controls</h4>
            <div className="space-y-3">
              <label className="flex items-start justify-between cursor-pointer">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Allow Text Selection</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Allow selection of text in the web page during live session?</p>
                </div>
                <input
                  type="checkbox"
                  checked={proctoring.allowTextSelection}
                  onChange={(e) => updateProctoringSetting('allowTextSelection', e.target.checked)}
                  className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>
              <label className="flex items-start justify-between cursor-pointer">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Allow Copy/Paste</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Allow Copying & Pasting content(s) in the web page during live session?</p>
                </div>
                <input
                  type="checkbox"
                  checked={proctoring.allowCopyPaste}
                  onChange={(e) => updateProctoringSetting('allowCopyPaste', e.target.checked)}
                  className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>
              <label className="flex items-start justify-between cursor-pointer">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Allow Right Click</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Allow right click in the web page during live session?</p>
                </div>
                <input
                  type="checkbox"
                  checked={proctoring.allowRightClick}
                  onChange={(e) => updateProctoringSetting('allowRightClick', e.target.checked)}
                  className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>
              <label className="flex items-start justify-between cursor-pointer">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Allow Other Restricted Events</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Allow other restricted events like debugging console, minimize, inspect element etc?</p>
                </div>
                <input
                  type="checkbox"
                  checked={proctoring.allowRestrictedEvents}
                  onChange={(e) => updateProctoringSetting('allowRestrictedEvents', e.target.checked)}
                  className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>
            </div>
          </div>

          {/* Alerts & Warnings */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Alerts & Warnings</h4>
            <div className="space-y-3">
              <label className="flex items-start justify-between cursor-pointer">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Alerts on Violation</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Show visual alerts when violations occur</p>
                </div>
                <input
                  type="checkbox"
                  checked={proctoring.alertsOnViolation}
                  onChange={(e) => updateProctoringSetting('alertsOnViolation', e.target.checked)}
                  className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>
              <label className="flex items-start justify-between cursor-pointer">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Beep Alerts</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Turn On Beep Alerts For this test?</p>
                </div>
                <input
                  type="checkbox"
                  checked={proctoring.beepAlerts}
                  onChange={(e) => updateProctoringSetting('beepAlerts', e.target.checked)}
                  className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>
              <label className="flex items-start justify-between cursor-pointer">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Exit/Close Warnings</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Warn the user before the browser tab is closed/refreshed?</p>
                </div>
                <input
                  type="checkbox"
                  checked={proctoring.exitCloseWarnings}
                  onChange={(e) => updateProctoringSetting('exitCloseWarnings', e.target.checked)}
                  className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>
            </div>
          </div>

          {/* Session Controls */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Session Controls</h4>
            <div className="space-y-3">
              <label className="flex items-start justify-between cursor-pointer">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Fullscreen Mandatory</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Is fullscreen mode mandatory during the live session?</p>
                </div>
                <input
                  type="checkbox"
                  checked={proctoring.fullscreenMandatory}
                  onChange={(e) => updateProctoringSetting('fullscreenMandatory', e.target.checked)}
                  className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>
              <label className="flex items-start justify-between cursor-pointer">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Single Session Login</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Is only one login session allowed throughout the exam?</p>
                </div>
                <input
                  type="checkbox"
                  checked={proctoring.singleSessionLogin}
                  onChange={(e) => updateProctoringSetting('singleSessionLogin', e.target.checked)}
                  className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>
            </div>
          </div>

          {/* Violation Actions */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Violation Actions</h4>
            <div className="space-y-4">
              <label className="flex items-start justify-between cursor-pointer">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Logout on Violation</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Logout a candidate if more than max violations are performed?</p>
                </div>
                <input
                  type="checkbox"
                  checked={proctoring.logoutOnViolation}
                  onChange={(e) => updateProctoringSetting('logoutOnViolation', e.target.checked)}
                  className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>
              <label className="flex items-start justify-between cursor-pointer">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Disqualify on Violation</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Disqualify a candidate if more than max violations are performed?</p>
                </div>
                <input
                  type="checkbox"
                  checked={proctoring.disqualifyOnViolation}
                  onChange={(e) => updateProctoringSetting('disqualifyOnViolation', e.target.checked)}
                  className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Violations Before Action
                </label>
                <input
                  type="number"
                  value={proctoring.maxViolationsBeforeAction}
                  onChange={(e) => updateProctoringSetting('maxViolationsBeforeAction', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  min="1"
                  max="20"
                />
              </div>
            </div>
          </div>

          {/* IP Restrictions */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">IP Restrictions</h4>
            <div className="space-y-4">
              <label className="flex items-start justify-between cursor-pointer">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Enable IP Restriction</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Restrict access to specific IP addresses</p>
                </div>
                <input
                  type="checkbox"
                  checked={proctoring.ipRestrictionEnabled}
                  onChange={(e) => updateProctoringSetting('ipRestrictionEnabled', e.target.checked)}
                  className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>
              {proctoring.ipRestrictionEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Allowed IP Addresses (one per line)
                  </label>
                  <textarea
                    value={proctoring.allowedIPs.join('\n')}
                    onChange={(e) => updateProctoringSetting('allowedIPs', e.target.value.split('\n').filter(ip => ip.trim()))}
                    placeholder="Enter IP addresses, one per line&#10;Example:&#10;192.168.1.1&#10;10.0.0.5"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Candidate will be allowed to access the test only from these IP addresses
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
