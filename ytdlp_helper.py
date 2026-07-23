"""
VELOCE AI — yt-dlp helper script
Called from main.js instead of `python -m yt_dlp --dump-json`
Uses yt-dlp's Python API directly — faster, more reliable, better error handling.
"""
import sys
import json
import os
from yt_dlp import YoutubeDL
from yt_dlp.networking.impersonate import ImpersonateTarget


def extract(url, cookies_file=None):
    """Extract video info — same as --dump-json but via API"""
    opts = {
        'quiet': True,
        'no_warnings': True,
        'no_check_certificates': True,
        'no_playlist': True,
        'impersonate': ImpersonateTarget.from_str('chrome'),
    }
    if cookies_file and os.path.exists(cookies_file):
        opts['cookiefile'] = cookies_file

    with YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)

        # Handle playlist/multi-entry results (bilibili, etc.)
        if info.get('_type') == 'playlist' or info.get('entries'):
            entries = info.get('entries', [])
            if entries:
                info = entries[0]  # Use first entry

        # Build clean format list (same logic as old main.js format processor)
        formats = info.get('formats', [])
        duration = info.get('duration', 0)

        seen = {}
        clean_formats = []

        # Sort by height descending
        formats.sort(key=lambda f: f.get('height') or 0, reverse=True)

        for f in formats:
            height = f.get('height')
            abr = f.get('abr')
            if not height and not abr:
                continue
            if f.get('format_note') == 'storyboard':
                continue

            # Prefer formats with video codec
            vcodec = f.get('vcodec')
            has_video = (vcodec and vcodec != 'none') or (height and height > 0)
            has_audio = f.get('acodec') and f.get('acodec') != 'none'

            if height:
                key = f'{height}p'
                fps = f.get('fps', 0)
                if fps and fps > 30:
                    key += str(fps)
            elif abr:
                key = f'audio-{round(abr)}k'
            else:
                continue

            # Deduplicate by resolution — prefer formats with video codec
            existing_has_video = seen.get(key)
            if existing_has_video:
                continue  # Already have a video format for this resolution
            if existing_has_video is not None and not has_video:
                continue  # Existing entry has no video, but neither does this one

            seen[key] = has_video

            # Estimate size from bitrate if not available
            filesize = f.get('filesize') or f.get('filesize_approx') or 0
            if filesize == 0 and duration > 0:
                bitrate = f.get('tbr') or f.get('vbr') or 0
                if bitrate:
                    filesize = round(duration * bitrate * 1000 / 8)

            filesize_str = ''
            if filesize > 0:
                if filesize > 1073741824:
                    filesize_str = f'{filesize / 1073741824:.1f} GB'
                else:
                    filesize_str = f'{filesize / 1048576:.0f} MB'

            clean_formats.append({
                'id': f.get('format_id', ''),
                'label': key,
                'ext': f.get('ext', 'mp4'),
                'height': height or 0,
                'fps': f.get('fps', 0),
                'filesize': filesize,
                'filesizeStr': filesize_str,
                'hasVideo': has_video,
                'hasAudio': has_audio,
            })

        # Fallback to "best" if no clean formats
        if not clean_formats:
            clean_formats.append({
                'id': 'best', 'label': 'Best', 'ext': 'mp4',
                'height': 0, 'fps': 0, 'filesize': 0, 'filesizeStr': '',
                'hasVideo': True, 'hasAudio': True,
            })

        video_formats = [f for f in clean_formats if f['hasVideo']][:5]
        audio_formats = [f for f in clean_formats if not f['hasVideo'] and f['hasAudio']][:2]

        duration_str = ''
        if duration > 0:
            if duration > 3600:
                h = int(duration // 3600)
                m = int((duration % 3600) // 60)
                s = int(duration % 60)
                duration_str = f'{h}:{m:02d}:{s:02d}'
            else:
                m = int(duration // 60)
                s = int(duration % 60)
                duration_str = f'{m}:{s:02d}'

        return {
            'ok': True,
            'title': info.get('title', '') or info.get('fulltitle', '') or 'Video',
            'thumbnail': info.get('thumbnail', ''),
            'duration': duration,
            'durationStr': duration_str,
            'uploader': info.get('uploader', '') or info.get('channel', ''),
            'extractor': info.get('extractor', '') or info.get('extractor_key', ''),
            'formats': video_formats,
            'audioFormats': audio_formats,
            'pageUrl': url,
        }

def download(url, format_id, is_audio, title, output_dir, cookies_file=None):
    """Download a video/audio format with progress reporting"""
    opts = {
        'quiet': True,
        'no_warnings': True,
        'no_playlist': True,
        'progress_with_newline': True,
        'newline': True,
        'impersonate': ImpersonateTarget.from_str('chrome'),
    }
    if cookies_file and os.path.exists(cookies_file):
        opts['cookiefile'] = cookies_file

    # Build output template
    safe_title = title.replace('/', '_').replace('\\', '_').replace(':', '_')[:80]
    out_template = os.path.join(output_dir, f'{safe_title}.%(ext)s')
    opts['outtmpl'] = out_template

    if is_audio:
        opts['format'] = 'bestaudio/best'
        opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
        }]
    else:
        opts['format'] = f'{format_id}+bestaudio/best'
        opts['merge_output_format'] = 'mp4'

    # Progress callback — prints JSON lines to stdout for main.js to parse
    def progress_hook(d):
        if d['status'] == 'downloading':
            pct = d.get('_percent_str', '0%').replace('%', '').strip()
            speed = d.get('_speed_str', '').strip()
            eta = d.get('_eta_str', '').strip()
            total = d.get('total_bytes') or d.get('total_bytes_estimate') or 0
            downloaded = d.get('downloaded_bytes', 0)
            total_mb = f'{total / 1048576:.1f} MB' if total > 0 else 'Unknown'
            received_mb = f'{downloaded / 1048576:.1f} MB'
            try:
                pct_val = float(pct)
            except ValueError:
                pct_val = 0
            print(json.dumps({
                'type': 'progress',
                'percent': round(pct_val),
                'speed': speed,
                'eta': eta,
                'size': total_mb,
                'received': received_mb,
                'status': 'Downloading',
            }), flush=True)
        elif d['status'] == 'finished':
            print(json.dumps({
                'type': 'progress',
                'percent': 100,
                'speed': '',
                'eta': '',
                'status': 'Downloading',
            }), flush=True)

    opts['progress_hooks'] = [progress_hook]

    with YoutubeDL(opts) as ydl:
        ydl.download([url])

    return {'ok': True}

if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else ''
    url = sys.argv[2] if len(sys.argv) > 2 else ''

    if mode == 'extract':
        cookies = sys.argv[3] if len(sys.argv) > 3 else None
        try:
            result = extract(url, cookies)
            print(json.dumps(result))
        except Exception as e:
            print(json.dumps({'ok': False, 'error': str(e)[:200]}))

    elif mode == 'download':
        format_id = sys.argv[3] if len(sys.argv) > 3 else ''
        is_audio = sys.argv[4] == 'true' if len(sys.argv) > 4 else False
        title = sys.argv[5] if len(sys.argv) > 5 else 'video'
        output_dir = sys.argv[6] if len(sys.argv) > 6 else '.'
        cookies = sys.argv[7] if len(sys.argv) > 7 else None
        try:
            result = download(url, format_id, is_audio, title, output_dir, cookies)
            print(json.dumps(result))
        except Exception as e:
            print(json.dumps({'ok': False, 'error': str(e)[:200]}))
