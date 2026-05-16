# Player

## 1. Mục tiêu

Cho user nghe audio mượt, resume nhanh, và kiểm soát playback ít thao tác nhất.

## 2. Entry / Exit

### Entry
- Từ audiobook detail
- Từ continue listening
- Từ resume notification

### Exit
- Back về audiobook detail
- Minimize sang background
- Chuyển sang next chapter nếu auto play

## 3. UI Components

- Play / pause
- Seek bar
- Skip forward / backward
- Speed selector
- Sleep timer
- Chapter title
- Resume marker
- Background playback state
- Trạng thái mất mạng nếu app đang offline

## 4. UI States

- `loading`
- `buffering`
- `playing`
- `paused`
- `ended`
- `error`
- `offline`

## 5. API Mapping

- `POST /assets/access`
- `POST /playback/progress`
- `GET /playback/progress/:audiobookId`

## 6. Interaction Rules

- Khi mở player, load asset access trước rồi mới play.
- Player phải tự save progress theo khoảng thời gian hợp lý, không chờ đến lúc thoát app.
- Seek xong phải sync lại progress.
- Speed change phải có feedback tức thì.
- Nếu mất mạng, vẫn phải giữ progress local và retry sync sau.

## 7. Edge Cases

- Asset access hết hạn giữa lúc nghe
- Mất mạng
- Chapter bị thiếu audio
- App bị kill đột ngột
- Resume sai chapter
- Playback bị block bởi quyền premium

## 8. Analytics

- `chapter_started`
- `playback_paused`
- `playback_resumed`
- `playback_seeked`
- `chapter_completed`
