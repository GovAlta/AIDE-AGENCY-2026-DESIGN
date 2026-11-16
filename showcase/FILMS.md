# Agency 2026 showcase films: the archive index

Every finished film, where its full-resolution master is, the code that made it, and how to make it again.
Audited 2026-11-15 (and again after the clean-up of the same day): every file in every finals folder passed `sha256sum -c`; every master was read with ffprobe (1920x1080, 60 frames
per second, H.264, stereo AAC 48 kHz) and its first and last seconds decoded; every repository's `main` was compared with GitHub;
every commit of every repository was searched for media, keys, passwords and the cloud project name, and none is left.

- **Media** (masters, voice clips, music, pictures, captures) stays on the build machine, read-only, in `/mnt/data/projects/agency-2026/finals/NN-slug/`.
- **Code and instructions** are on GitHub: one private repository per film, and the kit in GovAlta-EMU/AIDE-AGENCY-2026-DESIGN (`showcase/kit`).
- This file is `/mnt/data/projects/agency-2026/finals/INDEX.md`; the same text is `showcase/FILMS.md` in the design repository, so the instructions outlive the machine.

## The films

| Slot | Title | Approved | Length | Master (1080p60) | Master SHA-256 | Repository (private) | Commit | Kit commit (BUILD.json) | Music | Voice | Source audio banked | Source art banked |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 | Atlas | 2026-11-12 | 3:59 (239.77 s) | `atlas-1080p60.mp4` (215.0 MB) | `28d151d2dfbc86d8659d96fe4ceedbd9fce696e62dfdb565733d9cf0d7bb14c4` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-01-ATLAS | `6e35802` | `bf352cf` | `lifting-the-world.mp3` | Matilda (ElevenLabs `eleven_v4`) | yes: 32 files, 9 MB | yes: 6076 files, 1001 MB |
| 02 | Contact Alberta | 2026-11-12 | 2:15 (135.00 s) | `contact-alberta-1080p60.mp4` (153.8 MB) | `62199fd0c664ed77fcfe6db6143a9978a2b4bf779df7f627e0b43c285554223c` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-02-CONTACT-ALBERTA | `20e3a01` | `a116b03` | `piano-motif.mp3` | Matilda (ElevenLabs `eleven_v4`) | yes: 21 files, 8 MB | yes: 263 files, 68 MB |
| 03 | MVAI (Motion Video AI) | 2026-11-13 | 2:21 (141.80 s) | `mvai-1080p60.mp4` (91.7 MB) | `ff235b2bed106ccbb9c0b4ee7202422c52afee86cf302766e2a211304df3380f` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-03-MVAI | `968c676` | not recorded ¹ | `scene-setter.mp3` | Matilda (ElevenLabs `eleven_v4`) | yes: 18 files, 5 MB | yes: 2547 files, 145 MB |
| 04 | VSAI (Vector Studio AI) | 2026-11-13 | 2:22 (142.40 s) | `vsai-1080p60.mp4` (99.7 MB) | `c83f65b13fba64a2ffa486f77be74a7708d17f526721aa1bcd2412ae7288eb1a` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-04-VSAI | `3338e22` | `99f0de8` | `draw-me-a-road.mp3` | Matilda (ElevenLabs `eleven_v4`) | yes: 18 files, 6 MB | yes: 101 files, 21 MB |
| 05 | Highway and Bridge Simulator | 2026-11-13 | 2:59 (179.00 s) | `highway-bridge-1080p60.mp4` (307.1 MB) | `c09ddb10fea5c64295281efa9cd9e613a923ebff49670f60027ddd822a8e0ed3` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-05-HIGHWAY-BRIDGE | `92ee58f` | `d6390d9` | `build-it-fast.mp3` | Matilda (ElevenLabs `eleven_v4`) | yes: 26 files, 7 MB | yes: 5995 files, 1260 MB |
| 06 | Flood Simulator | 2026-11-13 | 2:47 (167.50 s) | `flood-1080p60.mp4` (69.0 MB) | `cf0bed6d5cb99803a099815bf9dfe4b8c602821c737f337f8a3cf618310fa05f` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-06-FLOOD | `6917a71` | `0076224` | `investigative-silence.mp3` | Matilda (ElevenLabs `eleven_v4`) | yes: 26 files, 6 MB | yes: 2632 files, 316 MB |
| 09 | AI Garage | 2026-11-13 | 3:03 (183.40 s) | `ai-garage-1080p60.mp4` (44.3 MB) | `6635a6fabf2dd5cff901309eb18ab6cd8aec20e590c5b1932c4568b1f78c3953` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-09-AI-GARAGE | `73637e9` | `0076224` | `fjordens-jubel.mp3` | Matilda (ElevenLabs `eleven_v4`) | yes: 29 files, 7 MB | yes: 7 files, 580 kB |
| 11 | Pan-Canadian Fibre Optics Planner | 2026-11-12 | 3:17 (197.60 s) | `pan-canadian-fibre-optics-planner-1080p60.mp4` (581.3 MB) | `7c597c18fcc96c2359175c2e5d608863f6f243a9605ac700ab75e43210259bf5` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-11-PAN-CANADIAN-FIBRE | `225d7e7` | none: own engine in `film/` ² | `forward-looking.mp3` | Matilda (ElevenLabs `eleven_v4`) | yes: 23 files, 7 MB | yes: 847 files, 43 MB |
| 12 | Alberta App | 2026-11-14 | 2:04 (124.80 s) | `alberta-app-1080p60.mp4` (23.4 MB) | `f85c585018afa4eda1dbbee899a827955359bee623e225af4749c82a58f6fb8c` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-12-ALBERTA-APP | `082ecad` | `0076224` | `measured-rise.mp3` | Matilda (ElevenLabs `eleven_v4`) | yes: 21 files, 4 MB | yes: 183 files, 27 MB |
| 13 | TI Contract Review | 2026-11-14 | 3:59 (239.70 s) | `contract-review-1080p60.mp4` (62.6 MB) | `1e2f65ae4f7ae1d41da2101788d099734415bbc3f619b3cdda8d3629d343ed12` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-13-CONTRACT-REVIEW | `cb47ace` | `a09c413` | `lifting-the-world.mp3` | Matilda (ElevenLabs `eleven_v4`) | yes: 34 files, 9 MB | none needed ³ |
| 15 | OASIS | 2026-11-14 | 2:34 (154.50 s) | `oasis-1080p60.mp4` (34.5 MB) | `97c4c1558444d49a434e57bdc5007a3bc576996d39389cc2ca43e51efb666693` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-15-OASIS | `0c470bb` | `da48839` | `pass-the-page-edit-v5.wav`, made from the owner's `pass-the-page.mp3` | Matilda (ElevenLabs `eleven_v4`) | yes: 42 files, 84 MB | yes: 13 files, 3 MB |
| 16 | Business Case and Charter Builder | 2026-11-14 | 4:40 (280.40 s) | `business-case-1080p60.mp4` (73.3 MB) | `ac285521cc1ec21a06ae29ed4e50e671c5bc9d434ca6c8831d85c61eb61fa52e` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-16-BUSINESS-CASE | `c27cb06` | `a09c413` | `forward-looking-edit.wav`, made from the owner's `forward-looking.mp3` | Matilda (ElevenLabs `eleven_v4`) | yes: 48 files, 122 MB | yes: 456 files, 57 MB |
| 17 | AI Learning Interface (AILI) | 2026-11-15 | 4:19 (259.77 s) | `aili-1080p60.mp4` (92.7 MB) | `af8c2241bdd26e937715862a9aead5c2dc22bf7f83eff603a1ff3cf630301801` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-17-AILI | `b901890` ⁵ | `b16d494` | `curious-groove-edit.wav`, made from the owner's `Curious_Groove.mp3` | Matilda (ElevenLabs `eleven_v4`) | yes: 31 files, 57 MB | yes: 14 files, 19 MB (`source-art/`) |
| 19 | Keystone | 2026-11-15 | 4:10 (250.47 s) | `keystone-1080p60.mp4` (57.8 MB) | `de158459013066f43b856a5f82448fe9cfe9667d34e8f1d19c4cffd363e57ef9` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-19-KEYSTONE | `12c7e7b` ⁵ | `b16d494` | `Bright_Workshop_ext.wav`, made from the owner's `Bright_Workshop.mp3` | Matilda (ElevenLabs `eleven_v4`) | yes: 32 files, 80 MB | none needed ⁶ |
| 20 | Prototype Lab | 2026-11-15 | 4:06 (246.52 s) | `prototype-lab-1080p60.mp4` (73.2 MB) | `db6007a641fb514c33850ce3bafb0e5927e0177cc6502c5b7ef6f00d02b79a7b` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-20-PROTOTYPE-LAB | `9eb8611` | `b16d494` | `pulsing-arpeggio-edit.wav`, made from the owner's `Pulsing_Arpeggio.mp3` | Matilda (ElevenLabs `eleven_v4`) | yes: 32 files, 54 MB | yes: 5 files, 541 kB |
| 21 | PIA Builder | 2026-11-16 | 3:31 (211.29 s) | `pia-builder-1080p60.mp4` (58.1 MB) | `fe4ccf78fc9a9e6da9de316d3db2b1a1e68e811b9d0534ac2c4a714ef886e31e` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-21-PIA-BUILDER | `2e5547f` | `cdc09d1` | `Pulsing_Arpeggio.mp3` (the owner's track, lengthened by three bar-line repeats, no stretch) | Matilda (ElevenLabs `eleven_v4`) | yes: 31 files, 48 MB | none needed (nothing is outside git but the audio) |
| 22 | Procurement as Code Builder | 2026-11-16 | 2:38 (158.44 s) | `pac-builder-1080p60.mp4` (44.9 MB) | `82cc1070a7f5a547be9efa92d92532f72f43ff09fe55cab92bc0568c47779df0` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-22-PAC-BUILDER | `5533b0a` | `5d43708` | `Pulsing_Arpeggio.mp3` (the owner's track, played once) | Matilda (ElevenLabs `eleven_v4`) | yes: 22 files, 7 MB | none needed (nothing is outside git but the audio) |
| 23 | North Saskatchewan River Water Quality | 2026-11-16 | 2:38 (158.44 s) | `river-water-quality-1080p60.mp4` (49.3 MB) | `9f450cbd3a8c05701db7fd6ae805a10f5319a6c7be348455809b0d8b5df6597a` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-23-RIVER-WATER-QUALITY | `179544f` | `cdc09d1` | `Pulsing_Arpeggio.mp3` (the owner's track, played once) | Matilda (ElevenLabs `eleven_v4`) | yes: 24 files, 7 MB | yes: 198 files, 5 MB (`source-assets/`: the map data in `data/`, which is also in git, and the map tiles of the satellite look) |
| 25 | Parable | 2026-11-15 | 3:29 (208.84 s) | `parable-lms-1080p60.mp4` (46.5 MB) | `4ad272712dc71f2c102b84265ae045f2302a1ad11a52fd3a0c5434605d06f262` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-25-PARABLE-LMS | `bbab3e6` | `6371ff4` | `Marching_Pulse.mp3` | Matilda (ElevenLabs `eleven_v4`) | yes: 26 files, 8 MB | yes: 973 files, 10 MB |
| 32 | Pan-Canadian Digital Marketplace | 2026-11-14 (re-mixed and one shot fixed 2026-11-15) | 4:00 (240.22 s) | `pcdm-1080p60.mp4` (62.5 MB) | `c812aa24c0c7d663511efd8cf7732a4d78d1ca5253ad5f3790869d3d374f64dd` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-32-PCDM | `664512a` | `bce2ab6` | `marketplace-jig-edit.wav`, made from the owner's `Marketplace_Jig.mp3` | Matilda (ElevenLabs `eleven_v4`) | yes: 29 files, 10 MB | yes: 1188 files, 71 MB |
| 32 (French) | Marché numérique pancanadien | 2026-11-15 | 4:30 (269.88 s) | `pcdm-1080p60-fr.mp4` (73.4 MB) | `9f398e49f84f4e92c01aaf11b1d77ce1e525eacd122a2a14368880b87dee2da5` | https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-FILM-32-PCDM | `2feee2d` ⁴ | `bce2ab6` | `Marketplace_Jig.mp3` | Victoria (ElevenLabs `eleven_v4`) | yes: 29 files, 12 MB | yes: 515 files, 57 MB |

¹ Film 03: `BUILD.json` holds the film's own commit (`328509f`) in the kit field and says the kit had uncommitted changes. The build was
made on 2026-11-13 00:07 UTC; the newest kit commit before that is `7e07a74`. Use `7e07a74` or later and compare the stills with the master.
² Film 11 predates the kit. Its engine is in its own repository (`film/`); it has no `BUILD.json` and no `film.config.json`.
³ Film 13 draws every screen in code; nothing but the audio is outside git.
⁴ Both languages of film 32 are in one repository. `2feee2d` is the commit of the French film; the repository's `main` is the commit in the row above.
⁵ Films 17 and 19 were banked by other sessions on 2026-11-15. They were checked here without writing in their film folders: the finals
checksums, ffprobe, the commit, GitHub's `main`, no media in the tree, and the history scan.
⁶ Film 19: the only files outside git, apart from the audio, are a clone of the product in `prep/keystone/`; its `REPRODUCE.md` says a rebuild does not need it.

**Histories written again on 2026-11-15.** Four repositories were cleaned with `git filter-repo` and force-pushed, so every commit hash in
them changed; the table shows the new ones. The files that were taken out of git are still in the film folders and are banked.

| Film | Taken out of every commit | The repository as it was (backup bundle, local only) |
|---|---|---|
| 01 | the voice clips, the music file, two logs and a pid file | `/mnt/data/projects/agency-2026/archive/backups/01-atlas-before-filter-repo-20261115.bundle` |
| 02 | the voice clips and two music files | `/mnt/data/projects/agency-2026/archive/backups/02-contact-alberta-before-filter-repo-20261115.bundle` |
| 04 | one deploy log that named the cloud project | `/mnt/data/projects/agency-2026/archive/backups/04-vsai-before-filter-repo-20261115.bundle` |
| 11 | the voice clips and the music file | `/mnt/data/projects/agency-2026/archive/backups/11-pan-canadian-fibre-before-filter-repo-20261115.bundle` |

A bundle is a whole repository in one file: `git clone NAME.bundle` opens it. The bundles hold what was removed, so they must never be
pushed anywhere. Films 15, 25 and 32 were cleaned the same way on 2026-11-14 and 15; their bundles are in the same folder.

Each finals folder holds the master, a smaller share copy (`*-share.mp4`), a 720p phone preview, the audio mix (`audio-mix.wav`), captions
(`.srt`, `.vtt`), `BUILD.json` and `film.config.json` (the build record and the settings, except film 11), and `SHA256SUMS`.

## How to rebuild a film

1. **Clone the film's repository** at the commit in the table: `git clone <repository URL> NN-slug`, then `git -C NN-slug checkout <commit>`.
2. **Check out the design repository at the kit commit**: `git clone https://github.com/GovAlta-EMU/AIDE-AGENCY-2026-DESIGN`, then
   `git -C AIDE-AGENCY-2026-DESIGN checkout <kit commit>` and `npm --prefix AIDE-AGENCY-2026-DESIGN/showcase/kit ci`. (Film 11 needs no kit: `npm ci` in its `film/`.)
3. **Put the banked audio back.** It is in `finals/NN-slug/source-audio/`. Check it first: `sha256sum -c SHA256SUMS` in that folder.
   - Films 01 to 16: `SOURCES.txt` in that folder lists each file with its path in the film folder. From the film folder:
     ```bash
     S=/mnt/data/projects/agency-2026/finals/NN-slug; F=$(pwd)
     tail -n +5 $S/source-audio/SOURCES.txt | while IFS='|' read -r f dst what; do f=$(echo $f); dst=$(echo $dst)
       mkdir -p "$F/$(dirname "$dst")" && cp --no-preserve=mode "$S/source-audio/$f" "$F/$dst"; done
     ```
   - Films 17, 19, 20, 25, 32: the folder is flat, with no list. The clips `nNN.mp3`, `timing.json` and the script files go to `narration/`;
     the music files go to `assets/music/`; `song-analysis.json` and `song-edit.json` go to `assets/`.
   - Film 32 in French (`32-pcdm-fr`): the clips and `timing.json` go to `narration/fr/`; the music goes to `assets/music/`.
4. **Put the banked pictures back.** `finals/NN-slug/source-assets/` holds the film folder's files that are not in git (captures, picture
   sequences, map tiles, saved answers), at the same relative paths: `cp -r --no-preserve=mode $S/source-assets/. $F/`.
   Film 17 keeps its pictures in `source-art/`; its `SOURCES.md` says where they go.
5. **Set the environment keys.** Voicing, transcription and the cloud render read `ENT_TOOLS_URL` and `ENT_TOOLS_API_KEY` from the
   environment (on the build machine: `source ~/.sandbox-env`), and the cloud render needs a signed-in `gcloud` with a project set
   (`gcloud config get-value project`). No key and no project name is written in any repository or in this file; keep it that way.
6. **Follow `REPRODUCE.md`** in the film's repository: dry run, stills, the cloud render (`cloud/farm.sh`), the sound mix, the encode.
   Films 20, 25 and 32 also carry their own dry check (`tools/reproduce-check.sh` or `.py`).

A rebuild from the banked clips and music gives the same pictures and the same mix. A rebuild that voices the script again, or cuts the
music again, gives a different take: it will not match the master bit for bit. The apps that some films record (named in each
`REPRODUCE.md`, with their commits) are separate projects on the build machine and are not part of this archive.

## How to verify a copy

```bash
cd /mnt/data/projects/agency-2026/finals/NN-slug
sha256sum -c SHA256SUMS                                   # the deliverables: every line must end in OK
( cd source-audio && sha256sum -c SHA256SUMS )            # the voice clips and the music
( cd source-assets && sha256sum -c SHA256SUMS )           # the pictures, where the film has them
sha256sum NAME-1080p60.mp4                                # must equal the Master SHA-256 in the table above
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate,channels:format=duration -of default=nw=1 NAME-1080p60.mp4
```

A good master reports `h264`, 1920 by 1080, `60/1`, an `aac` stereo stream at 48000 Hz, and the length in the table. A changed or
missing file fails the checksum. A copy on another disk is verified the same way.

Every file is read-only, and so is every film folder and every folder in it, so that nothing can be added, changed or removed by
accident. To bank a film again (a new approved cut), make its folder writable, do the work, and lock it again:

```bash
chmod u+w /mnt/data/projects/agency-2026/finals/NN-slug                              # add u+w to a sub-folder too if it must change
# ... copy the new deliverables, write SHA256SUMS again, update the row in README.md and in this file ...
find /mnt/data/projects/agency-2026/finals/NN-slug -type d -exec chmod a-w {} +     # lock every folder again
find /mnt/data/projects/agency-2026/finals/NN-slug -type f -exec chmod a-w {} +     # and every file
```

## What is not on GitHub, and why

| Not on GitHub | Where it is | Why |
|---|---|---|
| Masters, share copies, previews, audio mixes | `finals/NN-slug/` | Owner's rule (2026-11-12): images and videos are kept on the machine at full resolution; GitHub holds code and text only. They are also too large for a repository. |
| Voice clips and music | `finals/NN-slug/source-audio/` | The same rule. The music is the owner's own track; its licence is with the owner. A new voicing is a new take, so the clips are kept. |
| Pictures, screen captures, picture sequences, map tiles, saved answers | `finals/NN-slug/source-assets/` (film 17: `source-art/`) | The same rule; some show screens of internal applications. |
| Rendered frames (`out/frames/`), storyboard sheets | the film folders in `/mnt/data/projects/agency-2026/showcase/` only | The build makes them again; they are 2 to 15 GB a film. They are not banked. |
| Keys, tokens, the cloud project name | the build machine's environment | Secrets and the project name are never committed. |
| The applications the films show | their own projects and repositories | They are not the film's code. Each `REPRODUCE.md` names the project and the commit. |

## Open items after the audit and clean-up of 2026-11-15

- **Old commits on GitHub.** After a force-push, GitHub can keep the old commits for a time as objects that no branch points to. They are
  not in any branch, tag or pull request of films 01, 02, 04 and 11 (the two open pull requests of the governance bot in each repository
  were moved to the new history too). Only GitHub Support can remove them at once; ask if that matters.
- **Film 03**: the kit commit was not recorded (note ¹). Nothing can recover it; the note names the nearest commit.
- **Film 04**: two other small logs (`prep/contact.log`, `prep/encode.log`) are still in git. They do not name the cloud project. New logs are ignored.
- **Films 01 and 02**: earlier takes of some voice clips (32 and 2 files) were only in the old history. They are not in the films and are not banked; they are in the backup bundles.
- **Films 17 and 19** were banked by other sessions; this index records them but did not change their repositories.
