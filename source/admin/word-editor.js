/* 自定义 Decap 部件：真正的所见即所得编辑器（TinyMCE），发文不用写 Markdown */
(function () {
  if (!window.CMS || typeof CMS.registerWidget !== 'function') return;
  if (!window.React || !window.tinymce) {
    console.warn('[word-editor] 缺少 React 或 TinyMCE，退回到富文本模式');
    return;
  }

  var h = window.React.createElement;
  var seq = 0;

  var WordControl = (function () {
    function WordControl(props) {
      window.React.Component.call(this, props);
      this.uid = 'word-editor-' + ++seq;
      this.editor = null;
      this.syncing = false;
    }
    WordControl.prototype = Object.create(window.React.Component.prototype);
    WordControl.prototype.constructor = WordControl;

    WordControl.prototype.componentDidMount = function () {
      var self = this;
      var target = document.getElementById(this.uid);
      if (!target) return;
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
        toolbar_sticky: false,
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
    };

    WordControl.prototype.componentWillUnmount = function () {
      if (this.editor) {
        this.editor.remove();
        this.editor = null;
      }
    };

    WordControl.prototype.componentDidUpdate = function (prev) {
      if (!this.editor || prev.value === this.props.value) return;
      var next = this.props.value || '';
      if (this.editor.getContent() === next) return;
      this.syncing = true;
      this.editor.setContent(next);
      this.syncing = false;
    };

    WordControl.prototype.render = function () {
      return h('div', { className: 'word-editor-wrap' }, h('textarea', { id: this.uid, defaultValue: '' }));
    };

    return WordControl;
  })();

  CMS.registerWidget('word', WordControl, null);
})();
