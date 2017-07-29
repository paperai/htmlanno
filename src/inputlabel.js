class InputLabel{
  constructor(inputObject){
    this.inputObject = inputObject;
    this.endEditingListener = undefined;
    this._editing = false;
  }

  enable(){
    $(this.inputObject)
      .on("focusout", this.endEdit.bind(this))
      .on("blur", this.endEdit.bind(this))
      .removeAttr("disabled");
  }

  disable(){
    $(this.inputObject)
      .off("focusout")
      .off("blur")
      .attr("disabled", "disabled")
      .blur()
      .val("");
  }

  startEdit(value, endEditingListener){
    this.endEditingListener = endEditingListener;
    this._editing = true;
    this.show(value);
    this.enable();
  }

  endEdit(){
    if (this._editing){
      let value = $(this.inputObject).val();
      this.disable();
      this._editing = false;
      if (this.endEditingListener) {
        this.endEditingListener(value);
        this.endEditingListender = null;
      }
    }
  }

  show(value){
    $(this.inputObject).val(value);
  }

  clear(){
    $(this.inputObject).val("");
  }

  editing(){
    return this._editing;
  }
}
module.exports = InputLabel;
