import { computed, inject, Injectable, signal } from '@angular/core';
import { ApiErrorService } from './api-error.service';
import { LanguageService } from './language.service';

export type NotificationTone = 'success' | 'error' | 'info';
export interface AppNotification { id:number; tone:NotificationTone; message:string; }

@Injectable({providedIn:'root'})
export class NotificationService {
  private readonly errors=inject(ApiErrorService);
  private readonly language=inject(LanguageService);
  private readonly state=signal<AppNotification[]>([]);
  readonly notifications=computed(()=>this.state());
  private sequence=0;
  success(vi:string,en:string):void{this.show('success',this.language.choose(vi,en));}
  error(vi:string,en:string):void{this.show('error',this.language.choose(vi,en));}
  fromApi(error:unknown):void{
    const normalized=this.errors.normalize(error);
    const messages:Record<string,[string,string]>={
      CATEGORY_NAME_ALREADY_EXISTS:['Tên danh mục đã tồn tại. Vui lòng chọn tên khác.','This category name already exists. Please choose another name.'],
      CATEGORY_LANGUAGE_INVALID:['Danh mục chứa ngôn ngữ không hợp lệ hoặc đã bị vô hiệu hóa.','The category contains an invalid or inactive language.'],
      POST_CATEGORY_INVALID:['Danh mục đã chọn không tồn tại hoặc đã bị xóa.','The selected category does not exist or has been deleted.'],
      POST_LANGUAGE_INVALID:['Bài viết chứa ngôn ngữ không hợp lệ hoặc đã bị vô hiệu hóa.','The post contains an invalid or inactive language.'],
      POST_CANNOT_EDIT:['Bài viết ở trạng thái hiện tại không thể chỉnh sửa.','This post cannot be edited in its current status.'],
      POST_ALREADY_SUBMITTED:['Bài viết đã được gửi duyệt.','The post has already been submitted.'],
      AUTH_TOKEN_REQUIRED:['Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.','Your session has expired. Please sign in again.'],
    };
    const copy=messages[normalized.code];
    this.show('error',copy?this.language.choose(copy[0],copy[1]):normalized.messages[0]||this.language.choose('Không thể hoàn tất thao tác.','The operation could not be completed.'));
  }
  dismiss(id:number):void{this.state.update(items=>items.filter(item=>item.id!==id));}
  private show(tone:NotificationTone,message:string):void{const id=++this.sequence;this.state.update(items=>[...items,{id,tone,message}]);setTimeout(()=>this.dismiss(id),4500);}
}
