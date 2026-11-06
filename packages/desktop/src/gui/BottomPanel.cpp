#include "gui/BottomPanel.hpp"

#include <QHBoxLayout>
#include <QLabel>
#include <QPlainTextEdit>
#include <QStackedWidget>
#include <QToolButton>
#include <QVBoxLayout>

BottomPanel::BottomPanel(QWidget* parent) : QWidget(parent)
{
    setObjectName("BottomPanel");
    setMinimumHeight(32);
    setMaximumHeight(164);

    auto* root = new QVBoxLayout(this);
    root->setContentsMargins(0, 0, 0, 0);
    root->setSpacing(0);

    auto* header = new QWidget(this);
    header->setFixedHeight(31);
    auto* headerLayout = new QHBoxLayout(header);
    headerLayout->setContentsMargins(6, 1, 6, 1);
    headerLayout->setSpacing(3);

    const QStringList names = {"Waveform", "Console", "Netlist"};
    for (int i = 0; i < 3; ++i) {
        m_tabs[i] = new QToolButton(header);
        m_tabs[i]->setText(names[i]);
        m_tabs[i]->setCheckable(true);
        m_tabs[i]->setObjectName("BottomTab");
        connect(m_tabs[i], &QToolButton::clicked, this, [this, i]() {
            setActiveTab(i);
            if (m_collapsed) setCollapsed(false);
        });
        headerLayout->addWidget(m_tabs[i]);
    }
    headerLayout->addStretch();
    auto* clear = new QToolButton(header);
    clear->setText("× Clear");
    clear->setToolTip("Clear the active output panel");
    clear->setObjectName("IconButton");
    headerLayout->addWidget(clear);
    m_toggleButton = new QToolButton(header);
    m_toggleButton->setText("⌃");
    m_toggleButton->setToolTip("Expand output panel");
    m_toggleButton->setObjectName("IconButton");
    connect(m_toggleButton, &QToolButton::clicked, this, [this]() { setCollapsed(!m_collapsed); });
    headerLayout->addWidget(m_toggleButton);
    root->addWidget(header);

    m_pages = new QStackedWidget(this);
    auto* waveform = new QWidget(m_pages);
    auto* waveLayout = new QVBoxLayout(waveform);
    waveLayout->setContentsMargins(5, 5, 5, 5);
    auto* waveLabel = new QLabel("〰\nRun simulation to see waveforms", waveform);
    waveLabel->setAlignment(Qt::AlignCenter);
    waveLabel->setProperty("muted", true);
    waveLayout->addWidget(waveLabel);

    auto* console = new QPlainTextEdit(m_pages);
    console->setReadOnly(true);
    console->setPlainText("> Console ready. Run simulation to see output.");
    console->setObjectName("ConsoleText");

    auto* netlist = new QPlainTextEdit(m_pages);
    netlist->setReadOnly(true);
    netlist->setPlainText("Netlist will appear after circuit compilation.");
    netlist->setObjectName("NetlistText");

    m_pages->addWidget(waveform);
    m_pages->addWidget(console);
    m_pages->addWidget(netlist);
    root->addWidget(m_pages, 1);
    setActiveTab(0);
    setCollapsed(true);
}

void BottomPanel::setCollapsed(bool collapsed)
{
    m_collapsed = collapsed;
    m_pages->setVisible(!collapsed);
    setFixedHeight(collapsed ? 32 : 164);
    m_toggleButton->setText(collapsed ? "⌃" : "⌄");
    m_toggleButton->setToolTip(collapsed ? "Expand output panel" : "Collapse output panel");
    emit collapseChanged(collapsed);
}

void BottomPanel::setActiveTab(int index)
{
    m_pages->setCurrentIndex(index);
    for (int i = 0; i < 3; ++i) m_tabs[i]->setChecked(i == index);
}
