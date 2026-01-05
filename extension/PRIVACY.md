# Privacy Policy for PoC AI Content Detector

**Last Updated:** December 31, 2024

## Overview

PoC AI Content Detector is a browser extension that helps users identify AI-generated content and bot activity on webpages. We are committed to protecting your privacy.

## Data Collection

### Data We Store Locally

The extension stores the following data locally on your device using Chrome's storage API:

- **Scan Statistics**: Total number of scans performed, AI content detected, and session activity
- **API Configuration**: Your configured backend server URL
- **Extension Settings**: Your preferences and configuration options

This data is stored exclusively on your device and is never transmitted to any third party.

### Data Sent to Your Configured API Server

When you scan a webpage, the extension sends:

- **Text Content**: Selected text from the webpage being analyzed
- **Source URL**: The URL of the webpage being scanned
- **Platform Information**: The detected platform (Twitter, Reddit, etc.)

This data is sent to **your own configured backend server** for AI detection analysis. We do not operate any backend servers or collect this data ourselves.

## Permissions Explained

The extension requires the following permissions:

- **activeTab**: To read content from the webpage you're currently viewing when you click "Scan"
- **storage**: To save your settings and scan statistics locally
- **scripting**: To inject detection scripts into webpages
- **host_permissions (<all_urls>)**: To work on any website you choose to scan

## Third-Party Services

The extension connects to a backend API server that **you configure**. We do not provide, control, or have access to this server. You are responsible for:

- Running your own backend server (locally or hosted)
- Understanding the privacy policy of any third-party hosting service you use
- Securing your API endpoint

## Data Retention

All data is stored locally on your device. You can clear this data at any time by:

1. Removing the extension
2. Clearing Chrome's extension data
3. Using Chrome's privacy settings

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in the extension's repository.

## Contact

For questions about this privacy policy, please open an issue on our GitHub repository.

## Open Source

This extension is open source. You can review the complete source code to understand exactly how your data is handled.
