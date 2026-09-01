// Copyright (c) 2026 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @classdesc An on-screen console logger component for displaying live
 * logs, warnings, and errors in audio worklet interactive demos.
 */
class ConsoleLogger {
  /**
   * @param {string|HTMLElement} [target='#console-logger'] Element or selector.
   * @param {object} [options={}] Configuration options.
   * @param {number} [options.maxLines=100] Maximum lines retained.
   * @param {string} [options.title='Console Output'] Header title text.
   * @param {string} [options.maxHeight='22rem'] Maximum height of log pane.
   * @param {string} [options.minHeight='12rem'] Minimum height of log pane.
   */
  constructor(target = '#console-logger', options = {}) {
    this.maxLines_ = options.maxLines ?? 100;
    this.title_ = options.title ?? 'Console Output';
    this.maxHeight_ = options.maxHeight ?? '22rem';
    this.minHeight_ = options.minHeight ?? '12rem';

    if (typeof target === 'string') {
      this.container_ = document.querySelector(target);
    } else {
      this.container_ = target;
    }

    // Auto-create container inside #demo-box if not found in DOM
    if (!this.container_) {
      this.container_ = document.createElement('div');
      this.container_.id =
        typeof target === 'string'
          ? target.replace(/^#/, '')
          : 'console-logger';

      const panel = document.querySelector('[data-control-panel]');
      const demoBox = document.getElementById('demo-box');
      if (panel && panel.parentNode) {
        panel.parentNode.insertBefore(this.container_, panel);
      } else if (demoBox) {
        demoBox.appendChild(this.container_);
      } else {
        document.body.appendChild(this.container_);
      }
    }

    this.initUI_();
  }

  /**
   * Initializes the DOM structure and styling of the console logger.
   * @private
   */
  initUI_() {
    this.container_.innerHTML = '';
    this.container_.className =
      'my-3 flex flex-col rounded-lg border border-slate-700 bg-slate-900 ' +
      'text-slate-100 shadow-sm font-mono text-xs overflow-hidden';

    // Header bar
    const header = document.createElement('div');
    header.className =
      'flex items-center justify-between px-3 py-1.5 bg-slate-950/80 ' +
      'border-b border-slate-800 text-[11px] text-slate-400 select-none';

    const titleEl = document.createElement('div');
    titleEl.className =
      'flex items-center gap-1.5 font-semibold text-slate-300';
    titleEl.innerHTML =
      '<span class="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>' +
      `<span>${this.title_}</span>`;

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className =
      'px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 ' +
      'hover:bg-slate-700 hover:text-white transition-colors cursor-pointer';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', () => this.clear());

    header.appendChild(titleEl);
    header.appendChild(clearBtn);

    // Scrollable log output list with larger height
    this.logList_ = document.createElement('div');
    this.logList_.className =
      'p-3 space-y-1.5 overflow-y-auto scroll-smooth';
    this.logList_.style.maxHeight = this.maxHeight_;
    this.logList_.style.minHeight = this.minHeight_;

    this.container_.appendChild(header);
    this.container_.appendChild(this.logList_);

    this.renderPlaceholder_();
  }

  /**
   * Renders the empty state placeholder.
   * @private
   */
  renderPlaceholder_() {
    this.logList_.innerHTML =
      '<div class="text-slate-500 italic py-1">No logs yet. ' +
      'Click START to begin.</div>';
    this.isPlaceholder_ = true;
  }

  /**
   * Clears all log entries and restores the placeholder.
   */
  clear() {
    this.renderPlaceholder_();
  }

  /**
   * Formats argument array to string, preserving Error details and JSON.
   * @private
   * @param {*[]} args
   * @return {string}
   */
  formatArgs_(args) {
    return args
      .map((a) => {
        if (a instanceof Error) {
          return `${a.name}: ${a.message}` + (a.stack ? `\n  ${a.stack}` : '');
        }
        if (typeof a === 'object' && a !== null) {
          try {
            return JSON.stringify(a, null, 2);
          } catch {
            return String(a);
          }
        }
        return String(a);
      })
      .join(' ');
  }

  /**
   * Appends an entry to the log view.
   * @private
   * @param {'log'|'warn'|'error'} type
   * @param {string} text
   */
  appendEntry_(type, text) {
    if (this.isPlaceholder_) {
      this.logList_.innerHTML = '';
      this.isPlaceholder_ = false;
    }

    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    const ts = `${h}:${m}:${s}.${ms}`;

    const entry = document.createElement('div');
    entry.className = 'flex items-start gap-2 leading-relaxed break-all';

    let colorClass = 'text-slate-200';
    let badgeClass = 'text-slate-400 bg-slate-800';
    let label = 'LOG';

    if (type === 'warn') {
      colorClass = 'text-amber-300';
      badgeClass =
        'text-amber-300 bg-amber-950/60 border border-amber-800/60';
      label = 'WARN';
    } else if (type === 'error') {
      colorClass = 'text-rose-300';
      badgeClass = 'text-rose-300 bg-rose-950/60 border border-rose-800/60';
      label = 'ERR';
    }

    entry.innerHTML =
      `<span class="text-slate-500 shrink-0 select-none">${ts}</span>` +
      `<span class="px-1 rounded text-[9px] font-semibold shrink-0 ` +
      `select-none ${badgeClass}">${label}</span>` +
      `<span class="${colorClass} flex-1 whitespace-pre-wrap">${text}</span>`;

    this.logList_.appendChild(entry);

    // Limit line count
    while (this.logList_.children.length > this.maxLines_) {
      this.logList_.removeChild(this.logList_.firstChild);
    }

    // Auto-scroll to bottom
    this.logList_.scrollTop = this.logList_.scrollHeight;
  }

  /**
   * Logs a standard information message.
   * @param {...*} args
   */
  log(...args) {
    console.log(...args);
    this.appendEntry_('log', this.formatArgs_(args));
  }

  /**
   * Logs a warning message.
   * @param {...*} args
   */
  warn(...args) {
    console.warn(...args);
    this.appendEntry_('warn', this.formatArgs_(args));
  }

  /**
   * Logs an error message.
   * @param {...*} args
   */
  error(...args) {
    console.error(...args);
    this.appendEntry_('error', this.formatArgs_(args));
  }
}

export default ConsoleLogger;
