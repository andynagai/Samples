#!/usr/bin/php -q
<?php
# vim: ai ts=4 sts=4 et sw=4 tw=79
	/**
	 * Unsubscribe email box handler.
	 */

	require_once( __DIR__ . "/../lib/init.inc" );

	require_once(ORM_PATH."unsubscribed.inc");

	$unsubscribed = new Unsubscribed();

	$unsub_boxes = array('jobungo.com', 'careeralerter.com', 'wullo.com');

	$err_cnt = 0;

	$archive_path = 'jobungo_unparsed/';

	// Create unparsable email dir
	if(!is_dir($archive_path)) { 
		mkdir($archive_path);
	}

	// Process each unsubscribe mailbox
	foreach($unsub_boxes as $site_domain) {

		// Connect to mailbox
		$con = imap_open("{173.1.46.132/pop3/novalidate-cert}INBOX", 'unsubscribe@' . $site_domain, 'r3stm3d1a');

		$MC = imap_check($con);
		$range = "1:".$MC->Nmsgs;

		echo 'Processing ' . $site_domain . " unsubscribe mailbox \n";
		echo 'Total in mailbox: '.$MC->Nmsgs."\n";

		// Get the messages
		$response = imap_fetch_overview($con,$range);

		$msg_cnt = 1;

		// Only process mailbox if there are messages in it
		if($MC->Nmsgs > 0) {

			foreach ($response as $msg) {

				// Remove brackets from email
				if(strpos($msg->from, '<') !== false) {
					$email_exp = explode('<', $msg->from);
					$email_exp = explode('>', $email_exp[1]);
					$email = $email_exp[0];
				} else {
					$email = $msg->from;
				}

				// Verify email
				if(!Utility::validEmail($email)) {
					$email = false;
				}

				if($email!==false) {
					// Email is valid. Add email to unsubscribe table on bacon

					// Get site name
					$site_domain_exp = explode('.', $site_domain);
					$site_name = $site_domain_exp[0];

					// Get delivery date of email
					if($msg->date) {

						// Take out timezone adjustment -0700 portion from date string 'Wed, 20 Jun 2012 06:26:56 -0700'
						$dt_exp = explode('-', $msg->date);

						$deliv_dt = trim($dt_exp[0]);

						// Convert to mysql safe datetime
						$deliv_dt = date("Y-m-d H:i:s", strtotime($deliv_dt));

					} else {
						$deliv_dt = date('Y-m-d H:i:s');
					}

					$detail = 'Added via list-unsubscribe';

					// Add email as unsubscribed on bacon
					$unsubscribed->add_unsubscribed($site_name, $email, $deliv_dt, $detail);

					echo 'Added to unsubscribe on bacon: ' . $email . "\n";

				} else {
					// Email is invalid. Save each invalid email header and body to a .txt file

					$err_cnt++;
					$file_path = $archive_path . '/' . date('YmdHis') . '-' . $err_cnt . '.txt';
					$fh = fopen($file_path, 'w');

					// Email header and body
					$file_text = imap_fetchheader($con, $msg_cnt) . "\n" . imap_body($con, $msg_cnt);

					fwrite($fh, $file_text);
					fclose($fh);

					// Give file more permission
					chmod($file_path, 0664);

				}

				// Next message in mailbox
				$msg_cnt++;

				// Mark email to be deleted
				if(!imap_delete($con, $msg->uid, FT_UID)) {
					echo imap_last_error() . "\n";
				}

			}

			// Remove all marked emails to be deleted
			if(!imap_expunge($con)) {
				echo imap_last_error() . "\n";
			}

		}
	}

	// After porcessing all unsubscibe inboxes create compressed file of unparsable emails and upload
	if($err_cnt > 0) {

		// Create compressed bz2 file of error emails
		exec('tar cjvf error_emails.tar.bz2 jobungo_unparsed');

		// Upload compressed file to rmrpp upload.php form using post method
		$ch = curl_init();
		//curl_setopt($ch, CURLOPT_HEADER, 0);
		//curl_setopt($ch, CURLOPT_VERBOSE, 1);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_URL, 'http://stats_candy:icedteaisnotcoffee@andy-rmrpp.restdev.com/upload.php');
		curl_setopt($ch, CURLOPT_POST, true);

		$post = array(
				"userfile" => "@error_emails.tar.bz2;type=application/x-bzip2",
				"do_upload" => "1"
		);

		curl_setopt($ch, CURLOPT_POSTFIELDS, $post);

		// Upload the file to upload.php
		$response = curl_exec($ch);

		if($response) {
			echo "Successfully uploaded file of " . $err_cnt ." invalid emails\n";
		} else {
			echo "Error uploading file: " . curl_error($ch) . "\n";
		}

		// Close curl connection
		curl_close($ch);

		// Remove compressed file
		@unlink('error_emails.tar.bz2');

	}

	// Delete all files in jobungo_unparsed/ dir. Calls unlink() on each file in dir.
	array_map('unlink', glob("jobungo_unparsed/*.txt"));

	// Delete unparseable email dir
	rmdir($archive_path);

	echo "Finished processing all unsubscribe mailboxes \n";