<?php

/**
 * Plugin Name: Initiative Calculator
 * Description: Generates tailored service recommendations from form inputs using Gravity Forms.
 * Version: 1.0
 * Author: Kevin Franklin — Nomadic Software
 */

add_action('rest_api_init', function () {
  register_rest_route('initiative-calc/v1', '/services', [
    'methods' => 'GET',
    'callback' => 'initiative_calc_get_services',
    'permission_callback' => '__return_true'
  ]);
});

function initiative_calc_get_services()
{
  $json_path = plugin_dir_path(__FILE__) . 'services/services.json';
  $json = file_get_contents($json_path);
  return json_decode($json, true);
}

function initiative_calc_enqueue_assets()
{
  wp_enqueue_script(
    'initiative-calculator',
    plugin_dir_url(__FILE__) . 'assets/initiative-calculator.js',
    [],
    '1.0',
    true
  );
}
add_action('wp_enqueue_scripts', 'initiative_calc_enqueue_assets');
