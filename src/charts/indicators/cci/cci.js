﻿/**
Created By Mahboob.M on 12/16/2015
*/

define(["jquery", "common/rivetsExtra", "jquery-ui", 'color-picker', 'ddslick'], function ($, rv) {

    function closeDialog() {
        $(this).dialog('close');
    }

    function init(containerIDWithHash, _callback) {
        require(['css!charts/indicators/cci/cci.css']);

        require(['text!charts/indicators/cci/cci.html', 'text!charts/indicators/indicators.json'], function ($html, data) {

            $html = $($html);

            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.cci;
            var state = {
                "title": current_indicator_data.long_display_name,
                "description": current_indicator_data.description
            }
            rv.bind($html[0], state);

            $html.find("#cci_stroke_color").each(function () {
                $(this).colorpicker({
                    position: {
                        at: "right+100 bottom",
                        of: "element",
                        collision: "fit"
                    },
                    part: {
                        map: { size: 128 },
                        bar: { size: 128 }
                    },
                    select: function (event, color) {
                        $(this).css({
                            background: '#' + color.formatted
                        }).val('');
                        $(this).data("color", '#' + color.formatted);
                    },
                    ok: function (event, color) {
                        $(this).css({
                            background: '#' + color.formatted
                        }).val('');
                        $(this).data("color", '#' + color.formatted);
                    }
                });
            });

            var selectedDashStyle = "Solid";
            $('#cci_dash_style').ddslick({
                imagePosition: "left",
                width: 150,
                background: "white",
                onSelected: function (data) {
                    $('#cci_dash_style .dd-selected-image').css('max-width', '115px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#cci_dash_style .dd-option-image').css('max-width', '115px');

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                height:400,
                modal: true,
                my: "center",
                at: "center",
                of: window,
                dialogClass: 'cci-ui-dialog',
                buttons: [
					{
					    text: "OK",
					    click: function () {
                             var $elem = $(".cci_input_width_for_period");
                             if (!_.isInteger(_.toNumber($elem.val())) || !_.inRange($elem.val(),
                                             parseInt($elem.attr("min")),
                                             parseInt($elem.attr("max")) + 1)) {
                                 require(["jquery", "jquery-growl"], function ($) {
                                     $.growl.error({
                                         message: "Only numbers between " + $elem.attr("min")
                                                 + " to " + $elem.attr("max")
                                                 + " is allowed for " + $elem.closest('tr').find('td:first').text() + "!"
                                     });
                                 });
                                 $elem.val($elem.prop("defaultValue"));
                                 return;
                             };

					        var options = {
					            period: parseInt($("#cci_period").val()),
					            maType: $("#cci_ma_type").val(),
					            stroke: $("#cci_stroke_color").css("background-color"),
					            strokeWidth: parseInt($("#cci_stroke_width").val()),
					            dashStyle: selectedDashStyle
					        }
					        //Add CCI to the main series
					        $($(".cci").data('refererChartID')).highcharts().series[0].addIndicator('cci', options);

					        closeDialog.call($html);
					    }
					},
					{
					    text: "Cancel",
					    click: function () {
					        closeDialog.call(this);
					    }
					}
                ]
            });
            $html.find('select').each(function(index, value){
                $(value).selectmenu({
                    width : 150
                }).selectmenu("menuWidget").css("max-height","85px");
            });

            if ($.isFunction(_callback)) {
                _callback(containerIDWithHash);
            }

        });
    }

    return {
        open: function (containerIDWithHash) {
            if ($(".cci").length === 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cci").data('refererChartID', containerIDWithHash).dialog("open");
        }
    };
});