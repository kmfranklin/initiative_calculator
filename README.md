# Initiative Calculator Plugin

## Overview

This plugin dynamically generates tailored service recommendations based on user inputs collected through a Gravity Forms survey. It calculates two recommendation sets:

- **Matching Services:** Best services aligned with user priorities and importance.
- **Unlimited Possibilities:** All services across selected priority areas without budget limitations.

## How It Works

- Collects and saves form input (priorities + budget) into localStorage.
- Fetches services from a local JSON dataset via a custom REST endpoint.
- Scores and sorts services based on priority and internal weight.
- Displays matching and full-service lists on the form confirmation screen.

## File Structure

- `initiative-calculator.php`: Registers REST API endpoint and enqueues scripts.
- `assets/initiative-calculator.js`: Handles frontend logic (saving inputs, fetching data, rendering recommendations).
- `services/services.json`: Dataset containing service options, hours, timeframes, and priorities.

## Notes

- Designed for internal use by Nomadic Software.
- Requires Gravity Forms (AJAX-enabled forms recommended).
- Render output should be injected into a div with ID `initiative-results`.
