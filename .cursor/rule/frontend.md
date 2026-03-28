# Frontend Rule - Ngôn ngữ hiển thị

## Mục tiêu
- Tất cả nội dung hiển thị cho người dùng cuối phải dùng tiếng Việt có dấu.

## Quy tắc bắt buộc
- Không dùng tiếng Việt không dấu trong:
  - Tiêu đề trang, menu, nhãn, nút bấm.
  - Placeholder, helper text, tooltip, dialog.
  - Trạng thái hiển thị như thành công/lỗi/chờ xử lý.
- Có thể giữ nguyên thuật ngữ kỹ thuật tiếng Anh khi cần rõ nghĩa (ví dụ: API, PDF, Auto Pass, Auto Reject), nhưng phần diễn giải tiếng Việt vẫn phải có dấu.

## Quy tắc đặt text
- Ưu tiên text ngắn gọn, dễ hiểu, nhất quán giữa các màn.
- Nếu cùng một ý nghĩa, dùng cùng một cách viết trên toàn bộ UI.

## Xác nhận hành động — `ConfirmDialog` (bắt buộc khi cần popup xác nhận)

- Dùng component `@/components/confirm-dialog` (`ConfirmDialog`) cho mọi luồng cần **hỏi lại người dùng** trước khi thực hiện (xóa, gửi lại, hủy thay đổi, v.v.).
- **Không** lặp lại cấu trúc `Dialog` + `DialogHeader` + `DialogFooter` + hai nút chỉ để xác nhận trong từng page; gom về một component để đồng nhất copy tiếng Việt và hành vi.

### Props chính

| Prop | Ý nghĩa |
|------|--------|
| `open` / `onOpenChange` | Điều khiển hiển thị; trong `onOpenChange(false)` nên reset state liên quan (ví dụ bản ghi đang chọn xóa). |
| `title` | Tiêu đề ngắn, tiếng Việt có dấu. |
| `description` | Mô tả hậu quả thao tác, rõ ràng (ví dụ “không thể hoàn tác”). |
| `confirmLabel` / `cancelLabel` | Nhãn nút; mặc định xác nhận là “Xác nhận”, hủy là “Hủy”. |
| `confirmVariant` | `"default"` hoặc `"destructive"` — **bắt buộc dùng `destructive`** cho xóa / hành động nguy hiểm. |
| `isPending` | Đang gọi API: khóa nút, tránh double-submit. |
| `confirmPendingLabel` | Text nút xác nhận khi `isPending` (ví dụ “Đang xóa...”). |
| `onConfirm` | Callback khi bấm xác nhận; có thể `void asyncFn()` nếu cần async. |

### Ví dụ tối thiểu (xóa)

```tsx
const [open, setOpen] = useState(false)
const [pending, setPending] = useState(false)

<ConfirmDialog
  open={open}
  onOpenChange={(next) => {
    setOpen(next)
    if (!next) setItemToDelete(null)
  }}
  title="Xóa mục?"
  description={`Xóa “${item?.name ?? ""}”? Thao tác không thể hoàn tác.`}
  confirmLabel="Xóa"
  confirmPendingLabel="Đang xóa..."
  cancelLabel="Hủy"
  confirmVariant="destructive"
  isPending={pending}
  onConfirm={() => void handleDelete()}
/>
```

### Lưu ý UX

- Nút kích hoạt mở dialog (ví dụ icon xóa trên card) phải `stopPropagation()` nếu card/list row còn `onClick` mở chi tiết.
- Sau xác nhận thành công: đóng dialog, reset state, `toast` phản hồi (dùng `sonner` như các page khác).

## Quy tắc package manager (bắt buộc)
- Với thư mục `client`, luôn dùng `pnpm` thay vì `npm`.
- Ví dụ lệnh chuẩn:
  - `pnpm dev`
  - `pnpm build`
  - `pnpm lint`
- Không dùng `npm install` hoặc `npm run ...` cho phần Frontend trừ khi có yêu cầu đặc biệt.

## Cấu trúc thư mục Frontend
- Mục tiêu: tách rõ layout, routing, page, UI dùng chung, và dữ liệu mock để code dễ maintain.
- Cấu trúc chuẩn đề xuất cho `client/src`:
  - `components/ui`: các primitive component kiểu shadcn (button, card, input, dialog, ...)
  - `components`: component dùng chung ngoài nhóm `ui` (ví dụ `confirm-dialog`, `mode-toggle`, `theme-provider`)
  - `layouts`: layout khung trang (ví dụ sidebar, header, outlet)
  - `pages`: page theo route (`login-page`, `dashboard-page`, ...)
  - `routes`: cấu hình route tập trung
  - `mocks`: dữ liệu mock tách riêng khỏi page
  - `constants`: hằng số (auth key, menu config, ...)
  - `types`: kiểu dữ liệu dùng lại nhiều nơi
  - `lib`: utils/helper thuần
- Với page theo feature phức tạp, dùng cấu trúc:
  - `pages/<feature>/<feature>-page.tsx`: file page chính (state + orchestration)
  - `pages/<feature>/_components/*`: component nội bộ chỉ dùng cho feature đó
  - Không nhồi toàn bộ JSX lớn vào file page nếu có thể tách thành các khối UI rõ ràng (header/list/item/skeleton/filter).

## Quy tắc tổ chức code
- Mỗi file nên có 1 trách nhiệm chính; tránh file quá dài (trên ~250 dòng).
- Không nhét toàn bộ route + layout + page trong cùng 1 file.
- Page chỉ xử lý hiển thị và state cục bộ; dữ liệu mẫu import từ `mocks`.
- Route chỉ khai báo điều hướng, guard và mapping page.
- Layout chỉ chứa khung dùng chung (sidebar, header, outlet, action chung).
- Tránh tạo thẻ `div` trung gian nếu không phục vụ layout/semantic rõ ràng.
- Với cấu trúc JSX, ưu tiên DOM phẳng, dễ đọc; không bọc 2-3 lớp chỉ để chứa 1 phần tử con.
- Mỗi wrapper thêm mới phải có lý do cụ thể (spacing, border, sticky/scroll, group state, accessibility).

## Quy tắc bố cục UI (bắt buộc)
- Hạn chế lồng nhiều lớp `Card`: tối đa 1 lớp card chính cho một block nội dung.
- Không đặt `Card` bên trong `Card` chỉ để chia nhỏ danh sách; ưu tiên `div/section` + `border`, `grid`, `table` hoặc `list`.
- Với trang danh sách dữ liệu (email, CV, log...), ưu tiên:
  - Thanh tiêu đề + bộ lọc/action ở trên.
  - Danh sách phẳng bên dưới (row/list item) dễ scan, tránh khối card dày đặc.
- Phân trang là bắt buộc khi dữ liệu có thể dài: cần có trạng thái trang hiện tại, điều hướng trước/sau, và giới hạn page size.
- Trạng thái `loading/empty/error` cần hiển thị rõ ràng, không làm vỡ layout chính.

## Quy tắc loading state (bắt buộc)
- Không hiển thị text thuần kiểu `Đang tải...` cho các block nội dung chính.
- Phải dùng `Skeleton` cho trạng thái loading ở page/list/card chính.
- Skeleton cần phản ánh bố cục thật (header/list row/form fields) để tránh layout jump khi dữ liệu về.
- Chỉ dùng spinner hoặc text loading cho thao tác rất ngắn ở mức nút bấm (button-level action).

## Quy tắc empty state (bắt buộc)
- Empty state phải có khung `border dashed` để tách biệt khỏi nội dung chính.
- Bên trong hiển thị một icon mờ (opacity thấp), kích thước vừa phải, đóng vai trò minh họa.
- Bên dưới icon là một dòng text thông báo ngắn, rõ ràng, dễ hiểu.
- Ưu tiên bố cục căn giữa theo chiều dọc/ngang trong khung empty state.

## Checklist trước khi bàn giao UI
- Rà soát nhanh tất cả chuỗi text trong component vừa sửa.
- Chạy build/lint để đảm bảo sửa text không gây lỗi JSX.
