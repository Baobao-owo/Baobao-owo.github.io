/* 自定义 Decap 部件：所见即所得编辑器（TinyMCE）
   用 Decap 自己暴露的 window.h / window.createClass，避免 React 版本冲突（否则报 #525） */
(function () {
  function fail(reason) {
    console.error('[word-editor] ' + reason);
    var bar = document.createElement('div');
    bar.style.cssText =
      'position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:200000;background:#fff3cd;color:#7a5b00;' +
      'padding:10px 16px;border-radius:8px;font-size:13px;box-shadow:0 4px 14px rgba(0,0,0,.12)';
    bar.textContent = '正文编辑器没加载成功（' + reason + '），按 Ctrl+F5 强制刷新一次';
    document.body.appendChild(bar);
  }

  function register() {
    if (window.__wordEditorReady) return true;
    if (typeof window.CMS === 'undefined' || typeof CMS.registerWidget !== 'function') return false;
    if (typeof window.h !== 'function' || typeof window.createClass !== 'function') return false;

    var h = window.h;
    var createClass = window.createClass;
    var seq = 0;

  var WordControl = createClass({
    getInitialState: function () {
      this.editorId = 'word-editor-' + ++seq;
      this.editor = null;
      this.syncing = false;
      return {};
    },

    componentDidMount: function () {
      var self = this;
      var target = document.getElementById(this.editorId);
      if (!target || !window.tinymce) {
        // TinyMCE 没加载成功时，textarea 本身还能用
        return;
      }
      window.tinymce.init({
        target: target,
        license_key: 'gpl',
        height: 540,
        menubar: false,
        branding: false,
        promotion: false,
        resize: true,
        elementpath: false,
        toolbar_mode: 'wrap',
        skin_url: '/admin/vendor/tinymce/skins/ui/oxide',
        content_css: false,
        plugins:
          'lists link image media table code fullscreen searchreplace wordcount autolink preview anchor charmap insertdatetime visualblocks',
        toolbar:
          'undo redo | styles fontfamily fontsize | bold italic underline strikethrough forecolor backcolor | ' +
          'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ' +
          'link image media table | blockquote removeformat | code preview fullscreen',
        font_size_formats: '12pt 13pt 14pt 15pt 16pt 18pt 20pt 24pt 30pt 36pt',
        style_formats: [
          { title: '正文', block: 'p' },
          { title: '小标题', block: 'h3' },
          { title: '标题', block: 'h2' },
          { title: '引用', block: 'blockquote' },
          { title: '代码块', block: 'pre' }
        ],
        content_style:
          'body{font-family:"Microsoft YaHei UI","PingFang SC",system-ui,sans-serif;font-size:15px;line-height:1.9;color:#3d4b58;}' +
          'p{margin:0 0 10px;} h2{font-size:20px;} h3{font-size:17px;}' +
          'blockquote{margin:1em 0;padding:8px 14px;border-left:3px solid #4f7f9c;background:#f5f8fb;color:#5b6a77;}' +
          'pre{padding:12px 14px;border-radius:8px;background:#2f3b46;color:#e6edf3;}' +
          'img{max-width:100%;border-radius:8px;}',
        setup: function (editor) {
          self.editor = editor;
          editor.on('init', function () {
            self.syncing = true;
            editor.setContent(self.props.value || '');
            self.syncing = false;
          });
          editor.on('input change undo redo', function () {
            if (self.syncing) return;
            self.props.onChange(editor.getContent());
          });
        }
      });
    },

    componentDidUpdate: function (prevProps) {
      if (!this.editor || prevProps.value === this.props.value) return;
      var next = this.props.value || '';
      if (this.editor.getContent() === next) return;
      this.syncing = true;
      this.editor.setContent(next);
      this.syncing = false;
    },

    componentWillUnmount: function () {
      if (this.editor) {
        this.editor.remove();
        this.editor = null;
      }
    },

    render: function () {
      var self = this;
      return h(
        'div',
        { className: 'word-editor-wrap' },
        h('textarea', {
          id: this.editorId,
          defaultValue: this.props.value || '',
          onChange: function (e) {
            if (!self.editor) self.props.onChange(e.target.value);
          }
        })
      );
    }
  });

  CMS.registerWidget('word', WordControl, null);
    window.__wordEditorReady = true;
    console.log('[word-editor] 已注册');
    return true;
  }

  if (!register()) {
    var tries = 0;
    var timer = setInterval(function () {
      if (register()) {
        clearInterval(timer);
        return;
      }
      if (++tries >= 20) {
        clearInterval(timer);
        fail('依赖没就绪');
      }
    }, 150);
  }
})();
