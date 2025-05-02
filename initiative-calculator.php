<?php

/**
 * Plugin Name: Initiative Calculator
 * Description: Generates tailored service recommendations from form inputs using Gravity Forms.
 * Version: 1.0
 * Author: Kevin Franklin | Nomadic Software
 * License: All Rights Reserved
 */

/**
 * Registers a custom REST API route to deliver service dataset.
 */
add_action('rest_api_init', function () {
  register_rest_route('initiative-calc/v1', '/services', [
    'methods' => 'GET',
    'callback' => 'initiative_calc_get_services',
    'permission_callback' => '__return_true'
  ]);
});

/**
 * Loads and returns services dataset from JSON file.
 * 
 * @return array Decoded services array.
 */
function initiative_calc_get_services()
{
  $json_path = plugin_dir_path(__FILE__) . 'services/services.json';
  $json = file_get_contents($json_path);
  return json_decode($json, true);
}

/**
 * Enqueues the custom JavaScript and CSS files for the Initiative Calculator.
 */
function initiative_calc_enqueue_assets()
{
  wp_enqueue_script(
    'initiative-calculator',
    plugin_dir_url(__FILE__) . 'assets/initiative-calculator.js',
    [],
    '1.0',
    true
  );

  wp_enqueue_script(
    'chartjs',
    'https://cdn.jsdelivr.net/npm/chart.js',
    [],
    null,
    true
  );

  wp_enqueue_style(
    'initiative-calculator-styles',
    plugin_dir_url(__FILE__) . 'assets/styles.css',
    [],
    '1.0'
  );
}
add_action('wp_enqueue_scripts', 'initiative_calc_enqueue_assets');
